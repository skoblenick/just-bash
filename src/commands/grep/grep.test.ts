import { describe, it, expect } from 'vitest';
import { BashEnv } from '../../BashEnv.js';

describe('grep', () => {
  it('should find matching lines', async () => {
    const env = new BashEnv({
      files: { '/test.txt': 'hello world\nfoo bar\nhello again\n' },
    });
    const result = await env.exec('grep hello /test.txt');
    expect(result.stdout).toBe('hello world\nhello again\n');
    expect(result.stderr).toBe('');
    expect(result.exitCode).toBe(0);
  });

  it('should return exit code 1 when no match', async () => {
    const env = new BashEnv({
      files: { '/test.txt': 'hello world\n' },
    });
    const result = await env.exec('grep missing /test.txt');
    expect(result.stdout).toBe('');
    expect(result.stderr).toBe('');
    expect(result.exitCode).toBe(1);
  });

  it('should be case sensitive by default', async () => {
    const env = new BashEnv({
      files: { '/test.txt': 'Hello\nhello\nHELLO\n' },
    });
    const result = await env.exec('grep hello /test.txt');
    expect(result.stdout).toBe('hello\n');
    expect(result.stderr).toBe('');
  });

  it('should be case insensitive with -i', async () => {
    const env = new BashEnv({
      files: { '/test.txt': 'Hello\nhello\nHELLO\n' },
    });
    const result = await env.exec('grep -i hello /test.txt');
    expect(result.stdout).toBe('Hello\nhello\nHELLO\n');
    expect(result.stderr).toBe('');
  });

  it('should be case insensitive with --ignore-case', async () => {
    const env = new BashEnv({
      files: { '/test.txt': 'Hello\nhello\n' },
    });
    const result = await env.exec('grep --ignore-case hello /test.txt');
    expect(result.stdout).toBe('Hello\nhello\n');
    expect(result.stderr).toBe('');
  });

  it('should show line numbers with -n', async () => {
    const env = new BashEnv({
      files: { '/test.txt': 'aaa\nbbb\naaa\n' },
    });
    const result = await env.exec('grep -n aaa /test.txt');
    expect(result.stdout).toBe('1:aaa\n3:aaa\n');
    expect(result.stderr).toBe('');
  });

  it('should show line numbers with --line-number', async () => {
    const env = new BashEnv({
      files: { '/test.txt': 'match\nno\nmatch\n' },
    });
    const result = await env.exec('grep --line-number match /test.txt');
    expect(result.stdout).toBe('1:match\n3:match\n');
    expect(result.stderr).toBe('');
  });

  it('should invert match with -v', async () => {
    const env = new BashEnv({
      files: { '/test.txt': 'keep\nremove\nkeep\n' },
    });
    const result = await env.exec('grep -v remove /test.txt');
    expect(result.stdout).toBe('keep\nkeep\n');
    expect(result.stderr).toBe('');
  });

  it('should invert match with --invert-match', async () => {
    const env = new BashEnv({
      files: { '/test.txt': 'yes\nno\nyes\n' },
    });
    const result = await env.exec('grep --invert-match no /test.txt');
    expect(result.stdout).toBe('yes\nyes\n');
    expect(result.stderr).toBe('');
  });

  it('should count matches with -c', async () => {
    const env = new BashEnv({
      files: { '/test.txt': 'a\nb\na\na\n' },
    });
    const result = await env.exec('grep -c a /test.txt');
    expect(result.stdout).toBe('3\n');
    expect(result.stderr).toBe('');
  });

  it('should count matches with --count', async () => {
    const env = new BashEnv({
      files: { '/test.txt': 'x\nx\ny\n' },
    });
    const result = await env.exec('grep --count x /test.txt');
    expect(result.stdout).toBe('2\n');
    expect(result.stderr).toBe('');
  });

  it('should list files with matches using -l', async () => {
    const env = new BashEnv({
      files: {
        '/a.txt': 'found here\n',
        '/b.txt': 'nothing\n',
        '/c.txt': 'also found\n',
      },
    });
    const result = await env.exec('grep -l found /a.txt /b.txt /c.txt');
    expect(result.stdout).toBe('/a.txt\n/c.txt\n');
    expect(result.stderr).toBe('');
  });

  it('should list files with --files-with-matches', async () => {
    const env = new BashEnv({
      files: {
        '/a.txt': 'yes\n',
        '/b.txt': 'no\n',
      },
    });
    const result = await env.exec('grep --files-with-matches yes /a.txt /b.txt');
    expect(result.stdout).toBe('/a.txt\n');
    expect(result.stderr).toBe('');
  });

  it('should search recursively with -r', async () => {
    const env = new BashEnv({
      files: {
        '/dir/root.txt': 'needle here\n',
        '/dir/sub/file.txt': 'another needle\n',
      },
    });
    const result = await env.exec('grep -r needle /dir');
    expect(result.stdout).toBe('/dir/root.txt:needle here\n/dir/sub/file.txt:another needle\n');
    expect(result.stderr).toBe('');
  });

  it('should search recursively with -R', async () => {
    const env = new BashEnv({
      files: { '/dir/file.txt': 'findme\n' },
    });
    const result = await env.exec('grep -R findme /dir');
    expect(result.stdout).toBe('/dir/file.txt:findme\n');
    expect(result.stderr).toBe('');
  });

  it('should match whole words with -w', async () => {
    const env = new BashEnv({
      files: { '/test.txt': 'cat\ncats\ncat dog\ncaterpillar\n' },
    });
    const result = await env.exec('grep -w cat /test.txt');
    expect(result.stdout).toBe('cat\ncat dog\n');
    expect(result.stderr).toBe('');
  });

  it('should match whole words with --word-regexp', async () => {
    const env = new BashEnv({
      files: { '/test.txt': 'the\ntheme\nthe end\n' },
    });
    const result = await env.exec('grep --word-regexp the /test.txt');
    expect(result.stdout).toBe('the\nthe end\n');
    expect(result.stderr).toBe('');
  });

  it('should support extended regex with -E', async () => {
    const env = new BashEnv({
      files: { '/test.txt': 'cat\ndog\nbird\n' },
    });
    const result = await env.exec('grep -E "cat|dog" /test.txt');
    expect(result.stdout).toBe('cat\ndog\n');
    expect(result.stderr).toBe('');
  });

  it('should support extended regex with --extended-regexp', async () => {
    const env = new BashEnv({
      files: { '/test.txt': 'abc\nabc123\nxyz\n' },
    });
    const result = await env.exec('grep --extended-regexp "abc[0-9]+" /test.txt');
    expect(result.stdout).toBe('abc123\n');
    expect(result.stderr).toBe('');
  });

  it('should use -e to specify pattern', async () => {
    const env = new BashEnv({
      files: { '/test.txt': 'hello\nworld\n' },
    });
    const result = await env.exec('grep -e hello /test.txt');
    expect(result.stdout).toBe('hello\n');
    expect(result.stderr).toBe('');
  });

  it('should read from stdin', async () => {
    const env = new BashEnv();
    const result = await env.exec('echo -e "foo\\nbar\\nfoo" | grep foo');
    expect(result.stdout).toBe('foo\nfoo\n');
    expect(result.stderr).toBe('');
  });

  it('should error on missing pattern', async () => {
    const env = new BashEnv();
    const result = await env.exec('grep');
    expect(result.stdout).toBe('');
    expect(result.stderr).toBe('grep: missing pattern\n');
    expect(result.exitCode).toBe(2);
  });

  it('should error on missing file', async () => {
    const env = new BashEnv();
    const result = await env.exec('grep pattern /missing.txt');
    expect(result.stdout).toBe('');
    expect(result.stderr).toBe('grep: /missing.txt: No such file or directory\n');
    expect(result.exitCode).toBe(1);
  });

  it('should combine -in flags', async () => {
    const env = new BashEnv({
      files: { '/test.txt': 'Hello\nhello\n' },
    });
    const result = await env.exec('grep -in hello /test.txt');
    expect(result.stdout).toBe('1:Hello\n2:hello\n');
    expect(result.stderr).toBe('');
  });

  it('should show filename for multiple files', async () => {
    const env = new BashEnv({
      files: {
        '/a.txt': 'match\n',
        '/b.txt': 'match\n',
      },
    });
    const result = await env.exec('grep match /a.txt /b.txt');
    expect(result.stdout).toBe('/a.txt:match\n/b.txt:match\n');
    expect(result.stderr).toBe('');
  });

  it('should match literal text without regex interpretation', async () => {
    const env = new BashEnv({
      files: { '/test.txt': 'hello\nworld\nhello world\n' },
    });
    const result = await env.exec('grep "hello world" /test.txt');
    expect(result.stdout).toBe('hello world\n');
    expect(result.stderr).toBe('');
  });

  it('should skip directories in non-recursive mode', async () => {
    const env = new BashEnv({
      files: { '/dir/file.txt': 'content\n' },
    });
    const result = await env.exec('grep pattern /dir');
    expect(result.stdout).toBe('');
    expect(result.stderr).toBe('grep: /dir: Is a directory\n');
  });

  it('should count zero matches correctly with -c', async () => {
    const env = new BashEnv({
      files: { '/test.txt': 'no match here\n' },
    });
    const result = await env.exec('grep -c missing /test.txt');
    expect(result.stdout).toBe('0\n');
    expect(result.stderr).toBe('');
  });

  // Regex pattern tests
  describe('regex patterns', () => {
    it('should match beginning of line with ^', async () => {
      const env = new BashEnv({
        files: { '/test.txt': 'hello world\nworld hello\n' },
      });
      const result = await env.exec('grep "^hello" /test.txt');
      expect(result.stdout).toBe('hello world\n');
    });

    it('should match end of line with $', async () => {
      const env = new BashEnv({
        files: { '/test.txt': 'hello world\nworld hello\n' },
      });
      const result = await env.exec('grep "hello$" /test.txt');
      expect(result.stdout).toBe('world hello\n');
    });

    it('should match any character with .', async () => {
      const env = new BashEnv({
        files: { '/test.txt': 'cat\ncut\ncot\ncar\n' },
      });
      const result = await env.exec('grep "c.t" /test.txt');
      expect(result.stdout).toBe('cat\ncut\ncot\n');
    });

    it('should match zero or more with *', async () => {
      const env = new BashEnv({
        files: { '/test.txt': 'ac\nabc\nabbc\nabbbc\n' },
      });
      const result = await env.exec('grep "ab*c" /test.txt');
      expect(result.stdout).toBe('ac\nabc\nabbc\nabbbc\n');
    });

    it('should match character class with []', async () => {
      const env = new BashEnv({
        files: { '/test.txt': 'cat\nbat\nrat\nhat\n' },
      });
      const result = await env.exec('grep "[cbr]at" /test.txt');
      expect(result.stdout).toBe('cat\nbat\nrat\n');
    });

    it('should match negated character class with [^]', async () => {
      const env = new BashEnv({
        files: { '/test.txt': 'cat\nbat\nrat\nhat\n' },
      });
      const result = await env.exec('grep "[^cbr]at" /test.txt');
      expect(result.stdout).toBe('hat\n');
    });

    it('should escape special regex characters in literal search', async () => {
      const env = new BashEnv({
        files: { '/test.txt': 'price: $100\nprice: 100\n' },
      });
      // To match literal $, escape it with \\$ (shell escaping gives grep \$)
      const result = await env.exec('grep "\\\\\\$100" /test.txt');
      expect(result.stdout).toBe('price: $100\n');
    });

    it('should match digits with extended regex', async () => {
      const env = new BashEnv({
        files: { '/test.txt': 'abc\nabc123\n123abc\n' },
      });
      const result = await env.exec('grep -E "[0-9]+" /test.txt');
      expect(result.stdout).toBe('abc123\n123abc\n');
    });

    it('should match one or more with + in extended regex', async () => {
      const env = new BashEnv({
        files: { '/test.txt': 'ac\nabc\nabbc\n' },
      });
      const result = await env.exec('grep -E "ab+c" /test.txt');
      expect(result.stdout).toBe('abc\nabbc\n');
    });

    it('should match optional with ? in extended regex', async () => {
      const env = new BashEnv({
        files: { '/test.txt': 'color\ncolour\ncolr\n' },
      });
      const result = await env.exec('grep -E "colou?r" /test.txt');
      expect(result.stdout).toBe('color\ncolour\n');
    });

    it('should match groups with () in extended regex', async () => {
      const env = new BashEnv({
        files: { '/test.txt': 'ab\nabab\nababab\nac\n' },
      });
      const result = await env.exec('grep -E "(ab)+" /test.txt');
      expect(result.stdout).toBe('ab\nabab\nababab\n');
    });
  });

  // Edge cases
  describe('edge cases', () => {
    it('should handle empty file', async () => {
      const env = new BashEnv({
        files: { '/empty.txt': '' },
      });
      const result = await env.exec('grep pattern /empty.txt');
      expect(result.stdout).toBe('');
      expect(result.exitCode).toBe(1);
    });

    it('should handle file with only newlines', async () => {
      const env = new BashEnv({
        files: { '/newlines.txt': '\n\n\n' },
      });
      const result = await env.exec('grep "." /newlines.txt');
      expect(result.stdout).toBe('');
      expect(result.exitCode).toBe(1);
    });

    it('should handle very long lines', async () => {
      const env = new BashEnv({
        files: { '/long.txt': 'a'.repeat(10000) + 'needle' + 'b'.repeat(10000) + '\n' },
      });
      const result = await env.exec('grep needle /long.txt');
      expect(result.stdout).toContain('needle');
      expect(result.exitCode).toBe(0);
    });

    it('should handle multiple matches on same line', async () => {
      const env = new BashEnv({
        files: { '/test.txt': 'foo bar foo baz foo\n' },
      });
      const result = await env.exec('grep foo /test.txt');
      expect(result.stdout).toBe('foo bar foo baz foo\n');
    });

    it('should handle pattern that matches entire line', async () => {
      const env = new BashEnv({
        files: { '/test.txt': 'exactmatch\nno\n' },
      });
      const result = await env.exec('grep "^exactmatch$" /test.txt');
      expect(result.stdout).toBe('exactmatch\n');
    });

    it('should handle special characters in filenames', async () => {
      const env = new BashEnv({
        files: { '/file-with-dash.txt': 'content\n' },
      });
      const result = await env.exec('grep content /file-with-dash.txt');
      expect(result.stdout).toBe('content\n');
    });

    it('should handle unicode content', async () => {
      const env = new BashEnv({
        files: { '/unicode.txt': 'hello\n\u4e2d\u6587\nworld\n' },
      });
      const result = await env.exec('grep "\u4e2d\u6587" /unicode.txt');
      expect(result.stdout).toBe('\u4e2d\u6587\n');
    });

    it('should handle tabs in content', async () => {
      const env = new BashEnv({
        files: { '/tabs.txt': 'col1\tcol2\tcol3\n' },
      });
      const result = await env.exec('grep col2 /tabs.txt');
      expect(result.stdout).toBe('col1\tcol2\tcol3\n');
    });
  });

  // Combined flags
  describe('combined flags', () => {
    it('should combine -i and -v (case insensitive invert)', async () => {
      const env = new BashEnv({
        files: { '/test.txt': 'Hello\nWorld\nhello\n' },
      });
      const result = await env.exec('grep -iv hello /test.txt');
      expect(result.stdout).toBe('World\n');
    });

    it('should combine -c and -i (count case insensitive)', async () => {
      const env = new BashEnv({
        files: { '/test.txt': 'Hello\nhello\nHELLO\nworld\n' },
      });
      const result = await env.exec('grep -ci hello /test.txt');
      expect(result.stdout).toBe('3\n');
    });

    it('should combine -n and -v (line numbers with invert)', async () => {
      const env = new BashEnv({
        files: { '/test.txt': 'keep\nremove\nkeep\n' },
      });
      const result = await env.exec('grep -nv remove /test.txt');
      expect(result.stdout).toBe('1:keep\n3:keep\n');
    });

    it('should combine -l and -r (files with matches recursive)', async () => {
      const env = new BashEnv({
        files: {
          '/dir/a.txt': 'needle\n',
          '/dir/b.txt': 'no match\n',
          '/dir/sub/c.txt': 'needle here\n',
        },
      });
      const result = await env.exec('grep -rl needle /dir');
      expect(result.stdout).toContain('/dir/a.txt');
      expect(result.stdout).toContain('/dir/sub/c.txt');
      expect(result.stdout).not.toContain('b.txt');
    });

    it('should combine -w and -i (whole word case insensitive)', async () => {
      const env = new BashEnv({
        files: { '/test.txt': 'Cat\ncat\ncaterpillar\nCAT\n' },
      });
      const result = await env.exec('grep -wi cat /test.txt');
      expect(result.stdout).toBe('Cat\ncat\nCAT\n');
    });

    it('should combine -E and -i (extended regex case insensitive)', async () => {
      const env = new BashEnv({
        files: { '/test.txt': 'CAT\nDOG\nbird\n' },
      });
      const result = await env.exec('grep -Ei "cat|dog" /test.txt');
      expect(result.stdout).toBe('CAT\nDOG\n');
    });
  });

  // Piping tests
  describe('piping', () => {
    it('should work in middle of pipe chain', async () => {
      const env = new BashEnv({
        files: { '/test.txt': 'line1\nline2\nline3\nline4\nline5\n' },
      });
      const result = await env.exec('cat /test.txt | grep line | head -n 2');
      expect(result.stdout).toBe('line1\nline2\n');
    });

    it('should filter ls output', async () => {
      const env = new BashEnv({
        files: {
          '/dir/file.txt': '',
          '/dir/file.md': '',
          '/dir/other.js': '',
        },
      });
      const result = await env.exec('ls /dir | grep txt');
      expect(result.stdout).toBe('file.txt\n');
    });

    it('should chain multiple greps', async () => {
      const env = new BashEnv({
        files: { '/test.txt': 'apple pie\nbanana bread\napple tart\norange juice\n' },
      });
      const result = await env.exec('cat /test.txt | grep apple | grep pie');
      expect(result.stdout).toBe('apple pie\n');
    });

    it('should work with wc after grep', async () => {
      const env = new BashEnv({
        files: { '/test.txt': 'error: one\ninfo: two\nerror: three\nwarn: four\n' },
      });
      const result = await env.exec('grep error /test.txt | wc -l');
      expect(result.stdout.trim()).toBe('2');
    });
  });

  // Real-world scenarios
  describe('real-world scenarios', () => {
    it('should search for function definitions', async () => {
      const env = new BashEnv({
        files: {
          '/code.js': 'function hello() {\n  return "hello";\n}\nfunction world() {\n  return "world";\n}\n',
        },
      });
      const result = await env.exec('grep "function" /code.js');
      expect(result.stdout).toBe('function hello() {\nfunction world() {\n');
    });

    it('should search log files for errors', async () => {
      const env = new BashEnv({
        files: {
          '/app.log': '[INFO] Starting app\n[ERROR] Connection failed\n[INFO] Retrying\n[ERROR] Timeout\n[INFO] Success\n',
        },
      });
      const result = await env.exec('grep ERROR /app.log');
      expect(result.stdout).toBe('[ERROR] Connection failed\n[ERROR] Timeout\n');
    });

    it('should find TODO comments', async () => {
      const env = new BashEnv({
        files: {
          '/src/a.js': '// TODO: fix this\ncode here\n',
          '/src/b.js': '// Regular comment\n// TODO: implement\n',
        },
      });
      const result = await env.exec('grep -r TODO /src');
      expect(result.stdout).toContain('TODO');
    });

    it('should search config files', async () => {
      const env = new BashEnv({
        files: {
          '/config.json': '{\n  "port": 3000,\n  "host": "localhost",\n  "debug": true\n}\n',
        },
      });
      const result = await env.exec('grep "port" /config.json');
      expect(result.stdout).toBe('  "port": 3000,\n');
    });

    it('should find import statements', async () => {
      const env = new BashEnv({
        files: {
          '/index.ts': "import { foo } from './foo';\nimport { bar } from './bar';\nconst x = 1;\n",
        },
      });
      const result = await env.exec('grep "^import" /index.ts');
      expect(result.stdout).toBe("import { foo } from './foo';\nimport { bar } from './bar';\n");
    });

    it('should search for IP addresses', async () => {
      const env = new BashEnv({
        files: {
          '/hosts.txt': 'localhost 127.0.0.1\nserver 192.168.1.100\ngateway 10.0.0.1\n',
        },
      });
      const result = await env.exec('grep -E "[0-9]+\\.[0-9]+\\.[0-9]+\\.[0-9]+" /hosts.txt');
      expect(result.stdout).toBe('localhost 127.0.0.1\nserver 192.168.1.100\ngateway 10.0.0.1\n');
    });

    it('should find class definitions', async () => {
      const env = new BashEnv({
        files: {
          '/code.ts': 'class User {\n  name: string;\n}\nclass Admin extends User {\n}\n',
        },
      });
      const result = await env.exec('grep "^class" /code.ts');
      expect(result.stdout).toBe('class User {\nclass Admin extends User {\n');
    });
  });
});
