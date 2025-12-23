import { Command, CommandContext, ExecResult } from '../../types.js';

export const grepCommand: Command = {
  name: 'grep',

  async execute(args: string[], ctx: CommandContext): Promise<ExecResult> {
    let ignoreCase = false;
    let showLineNumbers = false;
    let invertMatch = false;
    let countOnly = false;
    let filesWithMatches = false;
    let recursive = false;
    let wholeWord = false;
    let extendedRegex = false;
    let pattern: string | null = null;
    const files: string[] = [];

    // Parse arguments
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (arg.startsWith('-') && arg !== '-') {
        if (arg === '-e' && i + 1 < args.length) {
          pattern = args[++i];
          continue;
        }

        const flags = arg.startsWith('--') ? [arg] : arg.slice(1).split('');

        for (const flag of flags) {
          if (flag === 'i' || flag === '--ignore-case') ignoreCase = true;
          else if (flag === 'n' || flag === '--line-number') showLineNumbers = true;
          else if (flag === 'v' || flag === '--invert-match') invertMatch = true;
          else if (flag === 'c' || flag === '--count') countOnly = true;
          else if (flag === 'l' || flag === '--files-with-matches') filesWithMatches = true;
          else if (flag === 'r' || flag === 'R' || flag === '--recursive') recursive = true;
          else if (flag === 'w' || flag === '--word-regexp') wholeWord = true;
          else if (flag === 'E' || flag === '--extended-regexp') extendedRegex = true;
        }
      } else if (pattern === null) {
        pattern = arg;
      } else {
        files.push(arg);
      }
    }

    if (pattern === null) {
      return {
        stdout: '',
        stderr: 'grep: missing pattern\n',
        exitCode: 2,
      };
    }

    // Build regex
    let regexPattern = extendedRegex ? pattern : escapeRegexForBasicGrep(pattern);
    if (wholeWord) {
      regexPattern = `\\b${regexPattern}\\b`;
    }

    let regex: RegExp;
    try {
      regex = new RegExp(regexPattern, ignoreCase ? 'gi' : 'g');
    } catch {
      return {
        stdout: '',
        stderr: `grep: invalid regular expression: ${pattern}\n`,
        exitCode: 2,
      };
    }

    // If no files and no stdin, read from stdin
    if (files.length === 0 && ctx.stdin) {
      const result = grepContent(ctx.stdin, regex, invertMatch, showLineNumbers, countOnly, '');
      return {
        stdout: result.output,
        stderr: '',
        exitCode: result.matched ? 0 : 1,
      };
    }

    if (files.length === 0) {
      return {
        stdout: '',
        stderr: 'grep: no input files\n',
        exitCode: 2,
      };
    }

    let stdout = '';
    let stderr = '';
    let anyMatch = false;
    const showFilename = files.length > 1 || recursive;

    // Collect all files to search
    const filesToSearch: string[] = [];
    for (const file of files) {
      if (recursive) {
        const expanded = await expandRecursive(file, ctx);
        filesToSearch.push(...expanded);
      } else {
        filesToSearch.push(file);
      }
    }

    for (const file of filesToSearch) {
      try {
        const filePath = ctx.fs.resolvePath(ctx.cwd, file);
        const stat = await ctx.fs.stat(filePath);

        if (stat.isDirectory) {
          if (!recursive) {
            stderr += `grep: ${file}: Is a directory\n`;
          }
          continue;
        }

        const content = await ctx.fs.readFile(filePath);
        const result = grepContent(
          content,
          regex,
          invertMatch,
          showLineNumbers,
          countOnly,
          showFilename ? file : ''
        );

        if (result.matched) {
          anyMatch = true;
          if (filesWithMatches) {
            stdout += file + '\n';
          } else {
            stdout += result.output;
          }
        } else if (countOnly && !filesWithMatches) {
          stdout += result.output;
        }
      } catch {
        stderr += `grep: ${file}: No such file or directory\n`;
      }
    }

    return {
      stdout,
      stderr,
      exitCode: anyMatch ? 0 : 1,
    };
  },
};

function escapeRegexForBasicGrep(str: string): string {
  // Basic grep (BRE) supports: . * ^ $ [] \
  // Only escape extended regex characters: + ? | () {}
  return str.replace(/[+?{}()|]/g, '\\$&');
}

function grepContent(
  content: string,
  regex: RegExp,
  invertMatch: boolean,
  showLineNumbers: boolean,
  countOnly: boolean,
  filename: string
): { output: string; matched: boolean } {
  let lines = content.split('\n');
  // Remove trailing empty line from split if content ended with newline
  if (lines.length > 0 && lines[lines.length - 1] === '') {
    lines = lines.slice(0, -1);
  }
  const matchedLines: string[] = [];
  let matchCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Reset regex state for global flag
    regex.lastIndex = 0;
    const matches = regex.test(line);

    if (matches !== invertMatch) {
      matchCount++;
      if (!countOnly) {
        let outputLine = line;
        if (showLineNumbers) {
          outputLine = `${i + 1}:${outputLine}`;
        }
        if (filename) {
          outputLine = `${filename}:${outputLine}`;
        }
        matchedLines.push(outputLine);
      }
    }
  }

  if (countOnly) {
    const countStr = filename ? `${filename}:${matchCount}` : String(matchCount);
    return { output: countStr + '\n', matched: matchCount > 0 };
  }

  return {
    output: matchedLines.length > 0 ? matchedLines.join('\n') + '\n' : '',
    matched: matchCount > 0,
  };
}

async function expandRecursive(path: string, ctx: CommandContext): Promise<string[]> {
  const fullPath = ctx.fs.resolvePath(ctx.cwd, path);
  const result: string[] = [];

  try {
    const stat = await ctx.fs.stat(fullPath);

    if (!stat.isDirectory) {
      return [path];
    }

    const entries = await ctx.fs.readdir(fullPath);
    for (const entry of entries) {
      if (entry.startsWith('.')) continue; // Skip hidden files

      const entryPath = path === '.' ? entry : `${path}/${entry}`;
      const expanded = await expandRecursive(entryPath, ctx);
      result.push(...expanded);
    }
  } catch {
    // Ignore errors
  }

  return result;
}
