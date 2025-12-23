/**
 * File system entry types
 */
export interface FileEntry {
  type: 'file';
  content: string;
  mode: number;
}

export interface DirectoryEntry {
  type: 'directory';
  mode: number;
}

export type FsEntry = FileEntry | DirectoryEntry;

/**
 * Stat result from the filesystem
 */
export interface FsStat {
  isFile: boolean;
  isDirectory: boolean;
  mode: number;
}

/**
 * Options for mkdir operation
 */
export interface MkdirOptions {
  recursive?: boolean;
}

/**
 * Options for rm operation
 */
export interface RmOptions {
  recursive?: boolean;
  force?: boolean;
}

/**
 * Options for cp operation
 */
export interface CpOptions {
  recursive?: boolean;
}

/**
 * Abstract filesystem interface that can be implemented by different backends.
 * This allows BashEnv to work with:
 * - VirtualFs (in-memory, default)
 * - Real filesystem (via node:fs)
 * - Custom implementations (e.g., remote storage, browser IndexedDB)
 */
export interface IFileSystem {
  /**
   * Read the contents of a file
   * @throws Error if file doesn't exist or is a directory
   */
  readFile(path: string): Promise<string>;

  /**
   * Write content to a file, creating it if it doesn't exist
   */
  writeFile(path: string, content: string): Promise<void>;

  /**
   * Append content to a file, creating it if it doesn't exist
   */
  appendFile(path: string, content: string): Promise<void>;

  /**
   * Check if a path exists
   */
  exists(path: string): Promise<boolean>;

  /**
   * Get file/directory information
   * @throws Error if path doesn't exist
   */
  stat(path: string): Promise<FsStat>;

  /**
   * Create a directory
   * @throws Error if parent doesn't exist (unless recursive) or path exists
   */
  mkdir(path: string, options?: MkdirOptions): Promise<void>;

  /**
   * Read directory contents
   * @returns Array of entry names (not full paths)
   * @throws Error if path doesn't exist or is not a directory
   */
  readdir(path: string): Promise<string[]>;

  /**
   * Remove a file or directory
   * @throws Error if path doesn't exist (unless force) or directory not empty (unless recursive)
   */
  rm(path: string, options?: RmOptions): Promise<void>;

  /**
   * Copy a file or directory
   * @throws Error if source doesn't exist or trying to copy directory without recursive
   */
  cp(src: string, dest: string, options?: CpOptions): Promise<void>;

  /**
   * Move/rename a file or directory
   */
  mv(src: string, dest: string): Promise<void>;

  /**
   * Resolve a relative path against a base path
   */
  resolvePath(base: string, path: string): string;

  /**
   * Get all paths in the filesystem (useful for glob matching)
   * Optional - implementations may return empty array if not supported
   */
  getAllPaths(): string[];
}

/**
 * Factory function type for creating filesystem instances
 */
export type FileSystemFactory = (initialFiles?: Record<string, string>) => IFileSystem;
