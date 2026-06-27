import { describe, it, expect } from 'vitest';
import { isMdLink, resolveMdPath, extractMdLinks } from './double-link';

describe('isMdLink', () => {
  it('recognizes .md links', () => {
    expect(isMdLink('./foo.md')).toBe(true);
    expect(isMdLink('../bar/index.md')).toBe(true);
    expect(isMdLink('https://example.com')).toBe(false);
    expect(isMdLink('./image.png')).toBe(false);
  });
});

describe('resolveMdPath', () => {
  const files = new Set(['local/Sales/index.md', 'local/Sales/About.md', 'local/Sales/2024/index.md', 'local/About.md']);

  it('resolves ./sibling', () => {
    expect(resolveMdPath('local/Sales/index.md', './2024/index.md', files)).toBe('local/Sales/2024/index.md');
  });

  it('resolves ../sibling', () => {
    expect(resolveMdPath('local/Sales/2024/index.md', '../About.md', files)).toBe('local/Sales/About.md');
  });

  it('returns null for non-existent file', () => {
    expect(resolveMdPath('local/Sales/index.md', './NotExist.md', files)).toBeNull();
  });

  it('returns null for non-md href', () => {
    expect(resolveMdPath('local/Sales/index.md', 'https://example.com', files)).toBeNull();
  });
});

describe('extractMdLinks', () => {
  it('extracts .md links from markdown text', () => {
    const md = 'See [Foo](./foo.md) and [Bar](../bar/index.md) for details. Also [External](https://example.com).';
    const links = extractMdLinks(md);
    expect(links).toEqual([
      { href: './foo.md', text: 'Foo' },
      { href: '../bar/index.md', text: 'Bar' },
    ]);
  });
});
