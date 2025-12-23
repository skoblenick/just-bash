import { VirtualFs, IFileSystem } from './fs.js';
import { Command, CommandContext, CommandRegistry, ExecResult } from './types.js';

// Import commands
import { echoCommand } from './commands/echo/echo.js';
import { catCommand } from './commands/cat/cat.js';
import { lsCommand } from './commands/ls/ls.js';
import { mkdirCommand } from './commands/mkdir/mkdir.js';
import { pwdCommand } from './commands/pwd/pwd.js';
import { touchCommand } from './commands/touch/touch.js';
import { rmCommand } from './commands/rm/rm.js';
import { cpCommand } from './commands/cp/cp.js';
import { mvCommand } from './commands/mv/mv.js';
import { headCommand } from './commands/head/head.js';
import { tailCommand } from './commands/tail/tail.js';
import { wcCommand } from './commands/wc/wc.js';
import { grepCommand } from './commands/grep/grep.js';

export interface BashEnvOptions {
  /**
   * Initial files to populate the virtual filesystem.
   * Only used when fs is not provided.
   */
  files?: Record<string, string>;
  /**
   * Environment variables
   */
  env?: Record<string, string>;
  /**
   * Initial working directory
   */
  cwd?: string;
  /**
   * Custom filesystem implementation.
   * If provided, 'files' option is ignored.
   * Defaults to VirtualFs if not provided.
   */
  fs?: IFileSystem;
}

export class BashEnv {
  private fs: IFileSystem;
  private cwd: string;
  private env: Record<string, string>;
  private commands: CommandRegistry = new Map();
  private previousDir: string = '/';

  constructor(options: BashEnvOptions = {}) {
    // Use provided filesystem or create a new VirtualFs
    this.fs = options.fs ?? new VirtualFs(options.files);
    this.cwd = options.cwd || '/';
    this.env = { HOME: '/', PATH: '/bin', ...options.env };

    // Register built-in commands
    this.registerCommand(echoCommand);
    this.registerCommand(catCommand);
    this.registerCommand(lsCommand);
    this.registerCommand(mkdirCommand);
    this.registerCommand(pwdCommand);
    this.registerCommand(touchCommand);
    this.registerCommand(rmCommand);
    this.registerCommand(cpCommand);
    this.registerCommand(mvCommand);
    this.registerCommand(headCommand);
    this.registerCommand(tailCommand);
    this.registerCommand(wcCommand);
    this.registerCommand(grepCommand);
  }

  registerCommand(command: Command): void {
    this.commands.set(command.name, command);
  }

  async exec(commandLine: string): Promise<ExecResult> {
    // Handle empty command
    if (!commandLine.trim()) {
      return { stdout: '', stderr: '', exitCode: 0 };
    }

    // Parse and execute pipelines (cmd1 | cmd2 | cmd3)
    const pipelines = this.splitPipelines(commandLine);

    let stdin = '';
    let lastResult: ExecResult = { stdout: '', stderr: '', exitCode: 0 };

    for (let i = 0; i < pipelines.length; i++) {
      const pipeline = pipelines[i].trim();
      if (!pipeline) continue;

      // Parse redirections and the actual command
      const { command: cmd, outputFile, appendMode, stderrToStdout } = this.parseRedirections(pipeline);

      // Handle command chaining (&&, ||, ;)
      const chainedCommands = this.splitChainedCommands(cmd);
      let chainResult: ExecResult = { stdout: '', stderr: '', exitCode: 0 };

      for (const { command: chainCmd, operator } of chainedCommands) {
        // Check if we should run based on previous result
        if (operator === '&&' && chainResult.exitCode !== 0) continue;
        if (operator === '||' && chainResult.exitCode === 0) continue;

        const result = await this.executeSimpleCommand(chainCmd.trim(), stdin);
        chainResult = {
          stdout: chainResult.stdout + result.stdout,
          stderr: chainResult.stderr + result.stderr,
          exitCode: result.exitCode,
        };
      }

      // Handle stderr to stdout redirection
      if (stderrToStdout) {
        chainResult.stdout += chainResult.stderr;
        chainResult.stderr = '';
      }

      // Handle output redirection
      if (outputFile) {
        const filePath = this.resolvePath(outputFile);
        if (appendMode) {
          await this.fs.appendFile(filePath, chainResult.stdout);
        } else {
          await this.fs.writeFile(filePath, chainResult.stdout);
        }
        chainResult.stdout = '';
      }

      // Pass stdout to next command as stdin
      stdin = chainResult.stdout;
      lastResult = chainResult;

      // For pipelines, accumulate stderr but pass stdout through
      if (i < pipelines.length - 1) {
        lastResult.stdout = '';
      }
    }

    // Final result has the output of the last command in the pipeline
    lastResult.stdout = stdin;
    return lastResult;
  }

  private splitPipelines(commandLine: string): string[] {
    const pipelines: string[] = [];
    let current = '';
    let inQuote: string | null = null;
    let i = 0;

    while (i < commandLine.length) {
      const char = commandLine[i];

      // Handle quotes
      if ((char === '"' || char === "'") && (i === 0 || commandLine[i - 1] !== '\\')) {
        if (inQuote === char) {
          inQuote = null;
        } else if (!inQuote) {
          inQuote = char;
        }
        current += char;
        i++;
        continue;
      }

      // Handle pipe (only outside quotes, and not ||)
      if (char === '|' && !inQuote) {
        if (commandLine[i + 1] === '|') {
          // This is ||, add both chars and skip
          current += '||';
          i += 2;
          continue;
        }
        // Single pipe - split here
        pipelines.push(current);
        current = '';
        i++;
        continue;
      }

      current += char;
      i++;
    }

    if (current) {
      pipelines.push(current);
    }

    return pipelines;
  }

  private splitChainedCommands(commandLine: string): Array<{ command: string; operator: string }> {
    const result: Array<{ command: string; operator: string }> = [];
    let current = '';
    let inQuote: string | null = null;
    let i = 0;
    let lastOperator = '';

    while (i < commandLine.length) {
      const char = commandLine[i];
      const nextChar = commandLine[i + 1];

      // Handle quotes
      if ((char === '"' || char === "'") && (i === 0 || commandLine[i - 1] !== '\\')) {
        if (inQuote === char) {
          inQuote = null;
        } else if (!inQuote) {
          inQuote = char;
        }
        current += char;
        i++;
        continue;
      }

      // Handle operators (only outside quotes)
      if (!inQuote) {
        if (char === '&' && nextChar === '&') {
          result.push({ command: current.trim(), operator: lastOperator });
          current = '';
          lastOperator = '&&';
          i += 2;
          continue;
        }
        if (char === '|' && nextChar === '|') {
          result.push({ command: current.trim(), operator: lastOperator });
          current = '';
          lastOperator = '||';
          i += 2;
          continue;
        }
        if (char === ';') {
          result.push({ command: current.trim(), operator: lastOperator });
          current = '';
          lastOperator = ';';
          i++;
          continue;
        }
      }

      current += char;
      i++;
    }

    if (current.trim()) {
      result.push({ command: current.trim(), operator: lastOperator });
    }

    return result;
  }

  private parseRedirections(command: string): {
    command: string;
    outputFile: string | null;
    appendMode: boolean;
    stderrToStdout: boolean;
  } {
    let outputFile: string | null = null;
    let appendMode = false;
    let stderrToStdout = false;
    let cmd = command;

    // Handle 2>&1
    if (cmd.includes('2>&1')) {
      stderrToStdout = true;
      cmd = cmd.replace('2>&1', '').trim();
    }

    // Handle >> (append)
    const appendMatch = cmd.match(/\s*>>\s*(\S+)\s*$/);
    if (appendMatch) {
      outputFile = appendMatch[1];
      appendMode = true;
      cmd = cmd.replace(/\s*>>\s*\S+\s*$/, '');
    } else {
      // Handle > (overwrite)
      const overwriteMatch = cmd.match(/\s*>\s*(\S+)\s*$/);
      if (overwriteMatch) {
        outputFile = overwriteMatch[1];
        cmd = cmd.replace(/\s*>\s*\S+\s*$/, '');
      }
    }

    return { command: cmd.trim(), outputFile, appendMode, stderrToStdout };
  }

  private async executeSimpleCommand(commandLine: string, stdin: string): Promise<ExecResult> {
    // Parse command and arguments (variable expansion happens inside parseCommand)
    const { command, args } = this.parseCommand(commandLine);

    if (!command) {
      return { stdout: '', stderr: '', exitCode: 0 };
    }

    // Handle cd specially (it modifies BashEnv state)
    if (command === 'cd') {
      return this.handleCd(args);
    }

    // Handle export
    if (command === 'export') {
      return this.handleExport(args);
    }

    // Handle unset
    if (command === 'unset') {
      return this.handleUnset(args);
    }

    // Handle exit
    if (command === 'exit') {
      const code = args[0] ? parseInt(args[0], 10) : 0;
      return { stdout: '', stderr: '', exitCode: isNaN(code) ? 1 : code };
    }

    // Look up and execute command
    const cmd = this.commands.get(command);
    if (!cmd) {
      return {
        stdout: '',
        stderr: `bash: ${command}: command not found\n`,
        exitCode: 127,
      };
    }

    const ctx: CommandContext = {
      fs: this.fs,
      cwd: this.cwd,
      env: this.env,
      stdin,
    };

    try {
      return await cmd.execute(args, ctx);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        stdout: '',
        stderr: `${command}: ${message}\n`,
        exitCode: 1,
      };
    }
  }

  private expandVariables(str: string): string {
    // Handle $VAR and ${VAR} and ${VAR:-default}
    return str.replace(/\$\{([^}]+)\}|\$([A-Za-z_][A-Za-z0-9_]*)/g, (_, braced, simple) => {
      if (braced) {
        // Handle ${VAR:-default}
        const defaultMatch = braced.match(/^([^:]+):-(.*)$/);
        if (defaultMatch) {
          const [, varName, defaultValue] = defaultMatch;
          return this.env[varName] ?? defaultValue;
        }
        return this.env[braced] ?? '';
      }
      return this.env[simple] ?? '';
    });
  }

  private parseCommand(commandLine: string): { command: string; args: string[] } {
    const tokens: string[] = [];
    let current = '';
    let inQuote: string | null = null;
    let i = 0;

    while (i < commandLine.length) {
      const char = commandLine[i];

      // Handle escape sequences
      if (char === '\\' && i + 1 < commandLine.length) {
        const nextChar = commandLine[i + 1];
        if (inQuote === "'") {
          // In single quotes, backslash is literal
          current += char;
          i++;
        } else if (inQuote === '"') {
          // In double quotes, only certain escapes are special
          if (nextChar === '"' || nextChar === '\\' || nextChar === '$' || nextChar === '`') {
            current += nextChar;
            i += 2;
          } else {
            // Keep backslash for other characters (like \n for echo -e)
            current += char;
            i++;
          }
        } else {
          // Outside quotes, backslash escapes next character
          current += nextChar;
          i += 2;
        }
        continue;
      }

      // Handle variable expansion (not in single quotes)
      if (char === '$' && inQuote !== "'") {
        const expanded = this.parseAndExpandVariable(commandLine, i);
        current += expanded.value;
        i = expanded.endIndex;
        continue;
      }

      // Handle quotes
      if ((char === '"' || char === "'")) {
        if (inQuote === char) {
          inQuote = null;
        } else if (!inQuote) {
          inQuote = char;
        } else {
          current += char;
        }
        i++;
        continue;
      }

      // Handle whitespace
      if (!inQuote && (char === ' ' || char === '\t')) {
        if (current) {
          tokens.push(current);
          current = '';
        }
        i++;
        continue;
      }

      current += char;
      i++;
    }

    if (current) {
      tokens.push(current);
    }

    const [command, ...args] = tokens;
    return { command: command || '', args };
  }

  private parseAndExpandVariable(str: string, startIndex: number): { value: string; endIndex: number } {
    let i = startIndex + 1; // Skip the $

    if (i >= str.length) {
      return { value: '$', endIndex: i };
    }

    // Handle ${VAR} and ${VAR:-default}
    if (str[i] === '{') {
      const closeIndex = str.indexOf('}', i);
      if (closeIndex === -1) {
        return { value: '${', endIndex: i + 1 };
      }
      const content = str.slice(i + 1, closeIndex);
      // Handle ${VAR:-default}
      const defaultMatch = content.match(/^([^:]+):-(.*)$/);
      if (defaultMatch) {
        const [, varName, defaultValue] = defaultMatch;
        return {
          value: this.env[varName] ?? defaultValue,
          endIndex: closeIndex + 1,
        };
      }
      return {
        value: this.env[content] ?? '',
        endIndex: closeIndex + 1,
      };
    }

    // Handle $VAR
    let varName = '';
    while (i < str.length && /[A-Za-z0-9_]/.test(str[i])) {
      if (varName === '' && /[0-9]/.test(str[i])) {
        break; // Variable names can't start with digit
      }
      varName += str[i];
      i++;
    }

    if (!varName) {
      return { value: '$', endIndex: startIndex + 1 };
    }

    return {
      value: this.env[varName] ?? '',
      endIndex: i,
    };
  }

  private async handleCd(args: string[]): Promise<ExecResult> {
    const target = args[0] || this.env.HOME || '/';

    let newDir: string;
    if (target === '-') {
      newDir = this.previousDir;
    } else if (target === '~') {
      newDir = this.env.HOME || '/';
    } else {
      newDir = this.resolvePath(target);
    }

    try {
      const stat = await this.fs.stat(newDir);
      if (!stat.isDirectory) {
        return { stdout: '', stderr: `cd: ${target}: Not a directory\n`, exitCode: 1 };
      }
      this.previousDir = this.cwd;
      this.cwd = newDir;
      return { stdout: '', stderr: '', exitCode: 0 };
    } catch {
      return { stdout: '', stderr: `cd: ${target}: No such file or directory\n`, exitCode: 1 };
    }
  }

  private handleExport(args: string[]): ExecResult {
    for (const arg of args) {
      const eqIndex = arg.indexOf('=');
      if (eqIndex > 0) {
        const name = arg.slice(0, eqIndex);
        const value = arg.slice(eqIndex + 1);
        this.env[name] = value;
      }
    }
    return { stdout: '', stderr: '', exitCode: 0 };
  }

  private handleUnset(args: string[]): ExecResult {
    for (const arg of args) {
      delete this.env[arg];
    }
    return { stdout: '', stderr: '', exitCode: 0 };
  }

  private resolvePath(path: string): string {
    return this.fs.resolvePath(this.cwd, path);
  }

  // Public API for file access
  async readFile(path: string): Promise<string> {
    return this.fs.readFile(this.resolvePath(path));
  }

  async writeFile(path: string, content: string): Promise<void> {
    return this.fs.writeFile(this.resolvePath(path), content);
  }

  getCwd(): string {
    return this.cwd;
  }

  getEnv(): Record<string, string> {
    return { ...this.env };
  }
}
