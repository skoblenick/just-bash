// Executor for sed commands

import type {
  AddressRange,
  SedAddress,
  SedCommand,
  SedState,
} from "./types.js";

export function createInitialState(totalLines: number): SedState {
  return {
    patternSpace: "",
    holdSpace: "",
    lineNumber: 0,
    totalLines,
    deleted: false,
    printed: false,
    quit: false,
    appendBuffer: [],
  };
}

function matchesAddress(
  address: SedAddress,
  lineNum: number,
  totalLines: number,
  line: string,
): boolean {
  if (address === "$") {
    return lineNum === totalLines;
  }
  if (typeof address === "number") {
    return lineNum === address;
  }
  if (typeof address === "object" && "pattern" in address) {
    try {
      const regex = new RegExp(address.pattern);
      return regex.test(line);
    } catch {
      return false;
    }
  }
  return false;
}

export function isInRange(
  range: AddressRange | undefined,
  lineNum: number,
  totalLines: number,
  line: string,
): boolean {
  if (!range || (!range.start && !range.end)) {
    return true; // No address means match all lines
  }

  const start = range.start;
  const end = range.end;

  if (start !== undefined && end === undefined) {
    // Single address
    return matchesAddress(start, lineNum, totalLines, line);
  }

  if (start !== undefined && end !== undefined) {
    // Address range
    const startNum =
      typeof start === "number" ? start : start === "$" ? totalLines : 1;
    const endNum =
      typeof end === "number" ? end : end === "$" ? totalLines : totalLines;

    // Pattern addresses in ranges need special handling
    if (typeof start === "object" && "pattern" in start) {
      // For pattern ranges, check if we're in the range
      // This is a simplified implementation - real sed tracks range state
      const startMatches = matchesAddress(start, lineNum, totalLines, line);
      if (startMatches) return true;
    }

    return lineNum >= startNum && lineNum <= endNum;
  }

  return true;
}

export function processReplacement(
  replacement: string,
  match: string,
  groups: string[],
): string {
  let result = "";
  let i = 0;

  while (i < replacement.length) {
    if (replacement[i] === "\\") {
      if (i + 1 < replacement.length) {
        const next = replacement[i + 1];
        if (next === "&") {
          result += "&";
          i += 2;
          continue;
        }
        if (next === "n") {
          result += "\n";
          i += 2;
          continue;
        }
        if (next === "t") {
          result += "\t";
          i += 2;
          continue;
        }
        // Back-references \1 through \9
        const digit = parseInt(next, 10);
        if (digit >= 1 && digit <= 9) {
          result += groups[digit - 1] || "";
          i += 2;
          continue;
        }
        // Other escaped characters
        result += next;
        i += 2;
        continue;
      }
    }

    if (replacement[i] === "&") {
      result += match;
      i++;
      continue;
    }

    result += replacement[i];
    i++;
  }

  return result;
}

export function executeCommand(cmd: SedCommand, state: SedState): void {
  const { lineNumber, totalLines, patternSpace } = state;

  // Check if command applies to current line
  if (!isInRange(cmd.address, lineNumber, totalLines, patternSpace)) {
    return;
  }

  switch (cmd.type) {
    case "substitute": {
      let flags = "";
      if (cmd.global) flags += "g";
      if (cmd.ignoreCase) flags += "i";

      try {
        const regex = new RegExp(cmd.pattern, flags);
        const hadMatch = regex.test(state.patternSpace);

        state.patternSpace = state.patternSpace.replace(
          regex,
          (match, ...args) => {
            // Extract captured groups (all args before the last two which are offset and string)
            const groups = args.slice(0, -2) as string[];
            return processReplacement(cmd.replacement, match, groups);
          },
        );

        if (hadMatch && cmd.printOnMatch) {
          state.printed = true;
        }
      } catch {
        // Invalid regex, skip
      }
      break;
    }

    case "print":
      state.printed = true;
      break;

    case "delete":
      state.deleted = true;
      break;

    case "append":
      state.appendBuffer.push(cmd.text);
      break;

    case "insert":
      // Insert happens before the current line
      // We'll handle this in the main loop by prepending
      state.appendBuffer.unshift(`__INSERT__${cmd.text}`);
      break;

    case "change":
      // Replace the current line entirely
      state.patternSpace = cmd.text;
      state.deleted = true; // Don't print original
      state.appendBuffer.push(cmd.text);
      break;

    case "hold":
      // h - Copy pattern space to hold space
      state.holdSpace = state.patternSpace;
      break;

    case "holdAppend":
      // H - Append pattern space to hold space (with newline)
      if (state.holdSpace) {
        state.holdSpace += `\n${state.patternSpace}`;
      } else {
        state.holdSpace = state.patternSpace;
      }
      break;

    case "get":
      // g - Copy hold space to pattern space
      state.patternSpace = state.holdSpace;
      break;

    case "getAppend":
      // G - Append hold space to pattern space (with newline)
      state.patternSpace += `\n${state.holdSpace}`;
      break;

    case "exchange": {
      // x - Exchange pattern and hold spaces
      const temp = state.patternSpace;
      state.patternSpace = state.holdSpace;
      state.holdSpace = temp;
      break;
    }

    case "next":
      // n - Print pattern space (if not in quiet mode), read next line
      // This will be handled in the main loop
      state.printed = true;
      break;

    case "quit":
      state.quit = true;
      break;
  }
}

export function executeCommands(commands: SedCommand[], state: SedState): void {
  for (const cmd of commands) {
    if (state.deleted || state.quit) break;
    executeCommand(cmd, state);
  }
}
