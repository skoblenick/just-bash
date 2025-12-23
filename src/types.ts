import { IFileSystem } from './fs-interface.js';

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface CommandContext {
  fs: IFileSystem;
  cwd: string;
  env: Record<string, string>;
  stdin: string;
}

export interface Command {
  name: string;
  execute(args: string[], ctx: CommandContext): Promise<ExecResult>;
}

export type CommandRegistry = Map<string, Command>;

// Re-export IFileSystem for convenience
export type { IFileSystem };
