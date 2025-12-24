# BashEnv Unsupported Options and Behavior Differences

This document details the options and behaviors that are **not available** in BashEnv compared to real bash/GNU coreutils commands. Use this as a reference to understand the limitations of the simulated environment.

---

## Table of Contents

1. [File Operations](#file-operations) - cat, cp, mv, rm, mkdir, touch, chmod, ln
2. [Directory Listing](#directory-listing) - ls, tree, du
3. [Text Processing](#text-processing) - grep, sed, awk, sort, uniq, cut, tr, wc
4. [File Viewing](#file-viewing) - head, tail, cat
5. [File Search](#file-search) - find
6. [Path Utilities](#path-utilities) - basename, dirname, pwd, readlink, stat
7. [I/O Utilities](#io-utilities) - echo, printf, tee, xargs
8. [Environment](#environment) - env, alias, history
9. [Misc](#misc) - clear, true/false
10. [Summary](#summary)
11. [Implementation Priority for Coding Agents](#implementation-priority-for-coding-agents) - **TODO List**

---

## File Operations

### cat

**Supported:** `-n`, `--number`, `--help`, `-` (stdin)

| Unsupported Option | Description |
|-------------------|-------------|
| `-b` | Number only non-blank lines |
| `-e` | Display non-printing characters and `$` at line ends |
| `-s` | Squeeze multiple blank lines into one |
| `-t` | Display tabs as `^I` |
| `-u` | Disable output buffering |
| `-v` | Display non-printing characters visibly |
| `-l` | Set exclusive advisory lock on output |

**Behavior Differences:**
- No support for displaying non-printing characters (common debugging use case)
- No blank line squeezing

---

### cp

**Supported:** `-r`, `-R`, `--recursive`, `-n`, `--no-clobber`, `-p`, `--preserve`, `-v`, `--verbose`

| Unsupported Option | Description |
|-------------------|-------------|
| `-a`, `--archive` | Preserve all attributes (same as `-dR --preserve=all`) |
| `-b`, `--backup` | Make backups of existing destination files |
| `-f`, `--force` | Force copy by removing destination if needed |
| `-i`, `--interactive` | Prompt before overwrite |
| `-l`, `--link` | Hard link files instead of copying |
| `-L`, `--dereference` | Always follow symbolic links |
| `-P`, `--no-dereference` | Never follow symbolic links |
| `-s`, `--symbolic-link` | Make symbolic links instead of copying |
| `-u`, `--update` | Copy only when source is newer |
| `-t`, `--target-directory` | Copy all sources into directory |
| `-T`, `--no-target-directory` | Treat dest as normal file |

**Behavior Differences:**
- No interactive prompts or backup functionality
- Cannot create hard/symbolic links instead of copying

---

### mv

**Supported:** `-f`, `--force`, `-n`, `--no-clobber`, `-v`, `--verbose`, `--help`

| Unsupported Option | Description |
|-------------------|-------------|
| `-b`, `--backup` | Make backup of destination files |
| `-i`, `--interactive` | Prompt before overwrite |
| `-u`, `--update` | Move only when source is newer |
| `-t`, `--target-directory` | Move all sources into directory |
| `-T`, `--no-target-directory` | Treat dest as normal file |

**Behavior Differences:**
- No interactive prompts

---

### rm

**Supported:** `-r`, `-R`, `--recursive`, `-f`, `--force`

| Unsupported Option | Description |
|-------------------|-------------|
| `-i` | Prompt before every removal |
| `-I` | Prompt once before removing more than 3 files |
| `-d`, `--dir` | Remove empty directories |
| `-v`, `--verbose` | Explain what is being done |
| `--one-file-system` | Skip directories on different file systems |
| `--preserve-root` | Do not remove `/` (enabled by default) |
| `--no-preserve-root` | Allow removal of `/` |

**Behavior Differences:**
- No interactive prompts
- Cannot remove empty directories without `-r`
- No special handling for root directory

---

### mkdir

**Supported:** `-p`, `--parents`

| Unsupported Option | Description |
|-------------------|-------------|
| `-m`, `--mode=MODE` | Set file permission mode |
| `-v`, `--verbose` | Print message for each created directory |
| `-Z`, `--context` | Set SELinux context |

**Behavior Differences:**
- Cannot set specific permissions during creation
- Uses default permissions only

---

### touch

**Supported:** None (creates file only)

| Unsupported Option | Description |
|-------------------|-------------|
| `-a` | Change only access time |
| `-m` | Change only modification time |
| `-c`, `--no-create` | Do not create files |
| `-d`, `--date=STRING` | Use specified date instead of current time |
| `-t STAMP` | Use `[[CC]YY]MMDDhhmm[.ss]` format |
| `-r`, `--reference=FILE` | Use file's times instead of current time |
| `-h`, `--no-dereference` | Affect symlinks instead of referenced file |

**Behavior Differences:**
- **Major limitation:** Does not actually update timestamps for existing files
- Only creates new empty files
- Cannot specify timestamps

---

### chmod

**Supported:** `-R`, `--recursive`, octal modes (`755`), basic symbolic modes (`u+x`, `g-w`)

| Unsupported Option | Description |
|-------------------|-------------|
| `-c`, `--changes` | Report only when change is made |
| `-f`, `--silent`, `--quiet` | Suppress error messages |
| `-v`, `--verbose` | Output diagnostic for every file |
| `--preserve-root` | Fail to operate recursively on `/` |
| `--reference=RFILE` | Use RFILE's mode instead of MODE |
| `-H`, `-L`, `-P` | Symbolic link traversal control |

**Behavior Differences:**
- Symbolic mode starts with default `644`, not current permissions
- Limited special bit support (setuid/setgid/sticky)
- No verbose or changes-only output

---

### ln

**Supported:** `-s`, `--symbolic`, `-f`, `--force`, `-n`, `--no-dereference`

| Unsupported Option | Description |
|-------------------|-------------|
| `-b`, `--backup` | Make backup of existing destination files |
| `-d`, `-F`, `--directory` | Allow hardlinks to directories (superuser) |
| `-i`, `--interactive` | Prompt before overwrite |
| `-r`, `--relative` | Create relative symbolic links |
| `-t`, `--target-directory` | Specify target directory |
| `-T`, `--no-target-directory` | Treat link name as normal file |
| `-v`, `--verbose` | Print name of each linked file |

**Behavior Differences:**
- Only handles 2 arguments (no multiple targets to directory)
- The `-n` flag is accepted but not fully implemented

---

## Directory Listing

### ls

**Supported:** `-a`, `--all`, `-A`, `--almost-all`, `-d`, `--directory`, `-l`, `-r`, `--reverse`, `-R`, `--recursive`, `-t`, `-1`

| Unsupported Option | Description |
|-------------------|-------------|
| `-@` | Extended attributes in long format |
| `-C` | Multi-column output |
| `-F` | Append indicators (`/`, `*`, `@`, `=`, `%`, `\|`) |
| `-G`, `--color` | Colorized output |
| `-H`, `-L`, `-P` | Symlink following behavior |
| `-S` | Sort by size |
| `-h` | Human-readable sizes |
| `-i` | Show inode numbers |
| `-m` | Comma-separated format |
| `-n` | Numeric UIDs/GIDs |
| `-o` | Long format without group |
| `-p` | Append `/` to directories |
| `-s` | Show block count |
| `-u` | Sort by access time |

**Behavior Differences:**
- User/group hardcoded to `user user`
- Permissions simplified to `drwxr-xr-x` or `-rw-r--r--`
- No color support
- No human-readable sizes

---

### tree

**Supported:** `-a`, `-d`, `-L LEVEL`, `-f`

| Unsupported Option | Description |
|-------------------|-------------|
| `-C` | Turn on colorization |
| `-D` | Print last modification date |
| `-F` | Append type indicator |
| `-H baseHREF` | HTML output |
| `-I pattern` | Exclude files matching pattern |
| `-P pattern` | Include only files matching pattern |
| `-h` | Human-readable file sizes |
| `-p` | Print permissions |
| `-s` | Print size of each file |
| `-t` | Sort by modification time |
| `-r` | Reverse sort |
| `-u` | Print username |
| `-g` | Print group name |
| `--dirsfirst` | List directories before files |
| `-X` | XML output |

**Behavior Differences:**
- No colorization
- No file metadata (size, permissions, dates, owner)
- No pattern matching
- No sorting options
- Basic tree visualization only

---

### du

**Supported:** `-a`, `-h`, `-s`, `-c`, `--max-depth=N`

| Unsupported Option | Description |
|-------------------|-------------|
| `-A`, `--apparent-size` | Print apparent sizes |
| `-B`, `--block-size=SIZE` | Scale sizes |
| `-d N` | Short form of max-depth |
| `-L`, `--dereference` | Follow symbolic links |
| `-S`, `--separate-dirs` | Exclude subdirectory sizes |
| `-t`, `--threshold=SIZE` | Exclude entries smaller than SIZE |
| `--time` | Show modification time |
| `--exclude=PATTERN` | Exclude files matching pattern |
| `-x`, `--one-file-system` | Skip different file systems |

**Behavior Differences:**
- No symbolic link handling options
- No filtering by size threshold
- No time display
- No exclude patterns

---

## Text Processing

### grep

**Supported:** `-E`, `-F`, `-i`, `-v`, `-w`, `-c`, `-l`, `-L`, `-n`, `-h`, `-o`, `-q`, `-r`, `-R`, `-A`, `-B`, `-C`, `-e`, `--include`, `--exclude`, `--exclude-dir`, `--files-without-match`

| Unsupported Option | Description |
|-------------------|-------------|
| `-a`, `--text` | Treat files as text |
| `-b`, `--byte-offset` | Show byte offset |
| `--color` | Colorized output |
| `-f file` | Read patterns from file |
| `-m num` | Max count limit |
| `-x`, `--line-regexp` | Match entire line |
| `-z` | Null-separated lines |

**Behavior Differences:**
- No binary file detection/handling
- No color output
- Context separators may not show `--` between groups
- Pure TypeScript implementation may differ on edge cases

---

### sed

**Supported:** `-n`, `--quiet`, `-i`, `--in-place`, `-e`, `-E`, `-r`, `--regexp-extended`, substitution (`s/pattern/replacement/[gip]`), delete (`d`), print (`p`), address ranges, hold space (`h`, `H`, `g`, `G`, `x`), insert/append/change (`a`, `i`, `c`), next (`n`), quit (`q`)

| Unsupported Option | Description |
|-------------------|-------------|
| `-f file` | Read script from file |
| `-I extension` | In-place with backup |

**Missing Commands:**

| Command | Description |
|---------|-------------|
| `b` | Branch to label |
| `N` | Append next line to pattern space |
| `r file` | Read file |
| `t label` | Conditional branch |
| `w file` | Write to file |
| `y` | Transliterate |
| `:label` | Labels |
| `=` | Print line number |

**Behavior Differences:**
- No branching or labels
- No file I/O within script

---

### awk

**Supported:** `-F`, `-v`, `BEGIN`/`END` blocks, pattern matching, field references (`$1`, `$NF`, `$0`), NR, NF, FS, OFS, arithmetic, comparisons, `print`, `printf`, control structures (`if/else`, `while`, `for`, `for-in`), associative arrays, string functions (`length`, `substr`, `index`, `split`, `sub`, `gsub`, `sprintf`, `tolower`, `toupper`), ternary operator, `next`, `exit`

| Missing Feature | Description |
|----------------|-------------|
| User functions | `function` definitions |
| Math functions | `atan2`, `cos`, `exp`, `log`, `sin`, `sqrt`, `rand`, `srand` |
| I/O operations | `getline`, file/pipe redirection, `close`, `fflush`, `system` |
| Pattern ranges | `/start/,/end/` |
| `match()` | Returns position of regex match |
| `do-while` | Do-while loops |

**Behavior Differences:**
- No user-defined functions
- No I/O redirection within awk scripts
- Pattern ranges not supported

---

### sort

**Supported:** `-r`, `-n`, `-u`, `-k KEYDEF`, `-t CHAR`, `-f`, `--ignore-case`, `--help`, complex `-k` syntax (field ranges `-k2,4`, character positions `-k1.3`, per-key modifiers `n/r/f/b`), multiple keys for secondary sorting

| Unsupported Option | Description |
|-------------------|-------------|
| `-b` | Ignore leading blanks (global flag; per-key `b` modifier is supported) |
| `-c` | Check if sorted (no output) |
| `-d` | Dictionary order |
| `-g` | General numeric (floating point) |
| `-h` | Human numeric (K, M, G suffixes) |
| `-M` | Month name sorting |
| `-o FILE` | Output to file |
| `-s` | Stable sort |
| `-R` | Random sort |
| `-V` | Version sort |

**Behavior Differences:**
- Locale-dependent behavior may differ

---

### uniq

**Supported:** `-c`, `-d`, `-u`, `-i`, `--ignore-case`

| Unsupported Option | Description |
|-------------------|-------------|
| `-f NUM` | Skip first NUM fields |
| `-s CHARS` | Skip first CHARS characters |

**Behavior Differences:**
- Cannot skip fields or characters before comparison

---

### cut

**Supported:** `-c LIST`, `-f LIST`, `-d DELIM`, `-s`, `--only-delimited`, ranges (`1-3`, `1-`, `-3`, `1,3,5`)

| Unsupported Option | Description |
|-------------------|-------------|
| `-b LIST` | Select by bytes |
| `-n` | Don't split multibyte characters |
| `-w` | Use whitespace as delimiter (BSD) |
| `--output-delimiter` | Specify output delimiter |

**Behavior Differences:**
- Only character selection, not byte selection
- No whitespace delimiter support

---

### tr

**Supported:** `-d`, `-s`, character ranges (`a-z`, `A-Z`, `0-9`), escapes (`\n`, `\t`, `\r`), POSIX character classes (`[:alnum:]`, `[:alpha:]`, `[:digit:]`, `[:lower:]`, `[:upper:]`, `[:space:]`, `[:blank:]`, `[:punct:]`, `[:print:]`, `[:graph:]`, `[:cntrl:]`, `[:xdigit:]`)

| Unsupported Option | Description |
|-------------------|-------------|
| `-c`, `-C` | Complement (invert) character set |

**Missing Features:**

| Feature | Description |
|---------|-------------|
| `[=e=]` | Equivalence classes |
| `[c*n]` | Repeat notation |
| `\012`, `\x0a` | Octal/hex escapes |

**Behavior Differences:**
- No complement mode
- No octal/hex escape sequences

---

### wc

**Supported:** `-c`, `-m`, `--bytes`, `--chars`, `-l`, `--lines`, `-w`, `--words`

| Unsupported Option | Description |
|-------------------|-------------|
| `-L` | Length of longest line |

**Behavior Differences:**
- `-c` and `-m` treated identically (should differ for multibyte)

---

## File Viewing

### head

**Supported:** `-n NUM`, `--lines=NUM`, `-NUM`, `-c NUM`, `--bytes=NUM`

| Unsupported Option | Description |
|-------------------|-------------|
| `-q`, `--quiet` | Suppress headers for multiple files |
| `-v`, `--verbose` | Always show headers |

**Behavior Differences:**
- No size suffixes support (K, M, G)
- Always shows headers for multiple files

---

### tail

**Supported:** `-n NUM`, `--lines=NUM`, `-n +NUM`, `-NUM`, `-c NUM`, `--bytes=NUM`

| Unsupported Option | Description |
|-------------------|-------------|
| `-f` | Follow mode (wait for appended data) |
| `-F` | Follow with rotation detection |
| `-r` | Display in reverse order |
| `-q` | Suppress headers |
| `-b number` | 512-byte block positioning |

**Behavior Differences:**
- **No follow mode** (essential feature for log monitoring)
- No reverse display
- No block mode

---

## File Search

### find

**Supported:** `-name`, `-iname`, `-path`, `-ipath`, `-type`, `-empty`, `-maxdepth`, `-mindepth`, `-not`, `!`, `-a`, `-and`, `-o`, `-or`, `-exec ... \;`, `-exec ... +`, `-mtime`, `-newer`, `-size`, `-print0`, `-delete`, `--help`

| Missing Primary | Description |
|----------------|-------------|
| `-atime`, `-ctime` | Access/change time filtering |
| `-Btime` | Birth time filtering |
| `-perm mode` | Permission matching |
| `-user`, `-group` | Owner matching |
| `-uid`, `-gid` | Owner ID matching |
| `-links n` | Link count |
| `-inum n` | Inode number |
| `-regex`, `-iregex` | Regex matching |

| Missing Action | Description |
|----------------|-------------|
| `-execdir ... \;` | Execute in directory |
| `-prune` | Don't descend into directory |
| `-ls` | List in ls format |
| `-quit` | Exit immediately |

**Behavior Differences:**
- No permission/ownership filtering
- No parentheses grouping

---

## Path Utilities

### basename

**Supported:** `-a`, `--multiple`, `-s SUFFIX`, `--suffix=SUFFIX`

| Unsupported Option | Description |
|-------------------|-------------|
| `-z`, `--zero` | NUL-terminated output |

---

### dirname

**Supported:** Multiple arguments

| Unsupported Option | Description |
|-------------------|-------------|
| `-z`, `--zero` | NUL-terminated output |

---

### pwd

**Supported:** None (returns cwd only)

| Unsupported Option | Description |
|-------------------|-------------|
| `-L` | Logical path (default in bash) |
| `-P` | Physical path (resolve symlinks) |

**Behavior Differences:**
- No symlink resolution capability
- Ignores all arguments

---

### readlink

**Supported:** `-f`, `--canonicalize`

| Unsupported Option | Description |
|-------------------|-------------|
| `-e`, `--canonicalize-existing` | All components must exist |
| `-m`, `--canonicalize-missing` | No existence requirements |
| `-n`, `--no-newline` | No trailing newline |
| `-q`, `-s`, `--quiet`, `--silent` | Suppress errors |
| `-z`, `--zero` | NUL-terminated output |

---

### stat

**Supported:** `-c FORMAT` with: `%n`, `%N`, `%s`, `%F`, `%a`, `%A`, `%u`, `%U`, `%g`, `%G`

| Missing Format | Description |
|---------------|-------------|
| `%b`, `%B` | Block info |
| `%d`, `%D` | Device number |
| `%h` | Hard link count |
| `%i` | Inode number |
| `%m` | Mount point |
| `%w`, `%x`, `%y`, `%z` | Timestamps |
| `%W`, `%X`, `%Y`, `%Z` | Timestamps (seconds) |

| Unsupported Option | Description |
|-------------------|-------------|
| `-f`, `--file-system` | File system status |
| `-L`, `--dereference` | Follow links |
| `-t`, `--terse` | Terse output |

**Behavior Differences:**
- User/group info is **hardcoded** (user=1000, group=1000)
- Very limited format sequence support
- No real timestamps

---

## I/O Utilities

### echo

**Supported:** `-n`, `-e`, `-E`

| Missing Feature | Description |
|----------------|-------------|
| `\c` escape | Stop output at this point |

**Behavior Differences:**
- Follows GNU/bash behavior, not BSD
- BSD echo only supports `-n`, not `-e`/`-E`

---

### printf

**Supported:** Full format specifiers via sprintf-js, escape sequences

| Unsupported Feature | Description |
|--------------------|-------------|
| `%b` | Process escape sequences in argument |
| `%*.*f` | Width/precision from arguments |

---

### tee

**Supported:** `-a`, `--append`

| Unsupported Option | Description |
|-------------------|-------------|
| `-i` | Ignore SIGINT signal |
| `-p` | Preserve file metadata (GNU) |

---

### xargs

**Supported:** `-I REPLACE`, `-n NUM`, `-0`, `--null`, `-t`, `--verbose`, `-r`, `--no-run-if-empty`, `-P MAXPROCS`

| Unsupported Option | Description |
|-------------------|-------------|
| `-p`, `--interactive` | Prompt before executing |
| `-L NUMBER` | Lines mode |
| `-s SIZE` | Max command line length |
| `-x` | Exit if line too long |
| `-E EOFSTR` | Logical EOF marker |

**Behavior Differences:**
- No interactive mode
- No command line length limits

---

## Environment

### env

**Supported:** Print environment variables, `-i` (ignore environment), `-u NAME` (unset), `NAME=VALUE` (set variables), command execution with modified environment, `--help`, also `printenv` command

| Unsupported Option | Description |
|-------------------|-------------|
| `-C DIR` | Change working directory |
| `-S STRING` | Split STRING into arguments |
| `-v` | Verbose output |

**Behavior Differences:**
- No directory changing with `-C`
- No string splitting with `-S`

---

### alias / unalias

**Supported:** Define, list, remove aliases, `-a` (remove all)

| Unsupported Option | Description |
|-------------------|-------------|
| `-p` | Print in reusable format |

**Behavior Differences:**
- Aliases stored in environment variables, not shell structures
- Not automatically loaded from `.bashrc`

---

### history

**Supported:** `-c` (clear), `[n]` (show last n)

| Unsupported Option | Description |
|-------------------|-------------|
| `-a` | Append to history file |
| `-d offset` | Delete entry |
| `-n` | Read from history file |
| `-r` | Read and append from file |
| `-w` | Write to file |
| `-p` | History substitution |
| `-s` | Add to history list |

**Behavior Differences:**
- History stored in environment variable as JSON
- No persistent history file (`~/.bash_history`)
- No history expansion
- Limited to 1000 entries

---

## Misc

### clear

**Supported:** Clears terminal with ANSI escape

| Unsupported Option | Description |
|-------------------|-------------|
| `-T type` | Terminal type |
| `-x` | Don't clear scrollback |

**Behavior Differences:**
- Always uses ANSI escape sequence
- No terminfo database integration

---

### true / false

**Supported:** Returns exit code 0/1

| Unsupported Option | Description |
|-------------------|-------------|
| `--help` | Display help |
| `--version` | Version info |

---

## Summary

### Most Complete Implementations
1. **grep** - Most options supported
2. **cat** - Basic but solid
3. **ls** - Good coverage (though metadata is mocked)
4. **printf** - Full format support via sprintf-js
5. **basename/dirname** - Nearly complete

### Most Limited Implementations
1. **touch** - Only creates files, doesn't update timestamps
2. **awk** - No user-defined functions, math functions, or I/O redirection
3. **find** - No permission/ownership filters
4. **tree** - No file metadata or filtering options
5. **sed** - No branching/labels or file I/O within script

### Common Missing Features Across Commands
- Interactive prompts (`-i`)
- Backup functionality (`-b`)
- SELinux context (`-Z`)
- Color output
- Real ownership (user/group hardcoded)
- Advanced symbolic link handling

---

## Implementation Priority for Coding Agents

This prioritized list focuses on features most useful for AI coding agents like Claude. All critical features (Priority 1) have been implemented. ✅

### Recommended Implementation Order

<details>
<summary>Completed Phases 1-5 (click to expand)</summary>

**Phase 1: Unblock Core Workflows** ✅
- `mv` flags (`-f`, `-n`, `-v`)
- `grep --exclude`, `--exclude-dir`, `-L`
- `find -exec {} \;` and `-exec {} +`
- `sort -f` (case-insensitive)

**Phase 2: Enhanced Text Processing** ✅
- `awk` control structures, arrays, string functions
- `sed -E` (extended regex)
- `tr` POSIX character classes

**Phase 3: File Operations** ✅
- `cp -p`, `-n`
- `find -mtime`, `-newer`, `-size`
- `ls -l` real file sizes and timestamps

**Phase 4: Advanced Features** ✅
- `find -print0`, `-delete` + `xargs -0`, `-P`
- `sed` hold space (`h/H/g/G/x`), insert/append/change (`a/i/c`), quit (`q`)
- `env` command execution

**Phase 5: Polish** ✅
- `uniq -i`, `cut -s`
- `sort` complex `-k` syntax
- `awk` `next`, `exit`

</details>

**Phase 6: Advanced Text Processing**

| # | Feature | Command | Why It Matters |
|---|---------|---------|----------------|
| 1 | `N` append next line | `sed` | Multi-line pattern matching, joining lines |
| 2 | `y` transliterate | `sed` | Character-by-character translation (like `tr`) |
| 3 | `-c` complement | `tr` | Delete everything except certain chars |
| 4 | User-defined functions | `awk` | Reusable logic in complex scripts |
| 5 | Math functions | `awk` | `sin`, `cos`, `sqrt`, `rand` for calculations |

**Phase 7: Security & Metadata**

| # | Feature | Command | Why It Matters |
|---|---------|---------|----------------|
| 6 | `-perm` permission filter | `find` | Find files with specific permissions |
| 7 | `-user`, `-group` | `find` | Find files by owner |
| 8 | `-atime`, `-ctime` | `find` | Access/change time filtering |
| 9 | `-h` human-readable sizes | `ls`, `du` | Quick size assessment |

**Phase 8: Advanced Scripting**

| # | Feature | Command | Why It Matters |
|---|---------|---------|----------------|
| 10 | Branching (`b`, `t`, `:label`) | `sed` | Complex conditional scripts |
| 11 | `=` print line number | `sed` | Debugging, line counting |
| 12 | `-f file` read script | `sed` | External script files |
| 13 | Pattern ranges `/start/,/end/` | `awk` | Process sections of files |
| 14 | `getline` | `awk` | Read from files/pipes within awk |

**Phase 9: Nice to Have**

| # | Feature | Command | Why It Matters |
|---|---------|---------|----------------|
| 15 | `-f` follow mode | `tail` | Monitor logs (limited use in simulated env) |
| 16 | `-r` reverse | `tail` | Display file in reverse |
| 17 | `--color` | `grep`, `ls` | Visual clarity |
| 18 | `-v` verbose | Most commands | Debugging output |
| 19 | `-b` backup | `cp`, `mv` | Safety net for overwrites |
