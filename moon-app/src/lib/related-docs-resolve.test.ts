import { describe, it, expect } from 'vitest';
import { resolveRelated } from './related-docs-resolve';

const all = (files: Record<string, string>) =>
  Object.entries(files).map(([path, text]) => ({ path, text }));

describe('resolveRelated — outgoing', () => {
  it('解析 [[path]] 形式', () => {
    const files = all({
      'a.md': '看 [[b]]',
      'b.md': '# B',
    });
    const { outgoing } = resolveRelated({ currentPath: 'a.md', allFiles: files });
    expect(outgoing).toHaveLength(1);
    expect(outgoing[0]?.path).toBe('b.md');
    expect(outgoing[0]?.refType).toBe('outgoing');
  });

  it('支持 [[path|alias]]', () => {
    const files = all({
      'a.md': '看 [[b|这是 B]]',
      'b.md': '# B',
    });
    const { outgoing } = resolveRelated({ currentPath: 'a.md', allFiles: files });
    expect(outgoing).toHaveLength(1);
    expect(outgoing[0]?.path).toBe('b.md');
  });

  it('支持 [[alias]]（basename 匹配）', () => {
    const files = all({
      'a.md': '看 [[B]]',
      'b.md': '# B',
    });
    const { outgoing } = resolveRelated({ currentPath: 'a.md', allFiles: files });
    expect(outgoing).toHaveLength(1);
    expect(outgoing[0]?.path).toBe('b.md');
  });

  it('忽略代码块内的 [[wikilink]]', () => {
    const files = all({
      'a.md': '```\n[[b]]\n```\n# A',
      'b.md': '# B',
    });
    const { outgoing } = resolveRelated({ currentPath: 'a.md', allFiles: files });
    expect(outgoing).toEqual([]);
  });

  it('重复链接去重', () => {
    const files = all({
      'a.md': '[[b]] 和 [[b]] 再来一次',
      'b.md': '# B',
    });
    const { outgoing } = resolveRelated({ currentPath: 'a.md', allFiles: files });
    expect(outgoing).toHaveLength(1);
  });

  it('无当前文档返回空 outgoing', () => {
    const files = all({ 'b.md': '# B' });
    const { outgoing } = resolveRelated({ currentPath: 'a.md', allFiles: files });
    expect(outgoing).toEqual([]);
  });
});

describe('resolveRelated — incoming', () => {
  it('反向查找引用了当前文档的其他文档', () => {
    const files = all({
      'a.md': '# A',
      'b.md': '看 [[a]]',
      'c.md': '也看 [[a]]',
    });
    const { incoming } = resolveRelated({ currentPath: 'a.md', allFiles: files });
    expect(incoming.map((r) => r.path).sort()).toEqual(['b.md', 'c.md']);
    expect(incoming.every((r) => r.refType === 'incoming')).toBe(true);
  });

  it('incoming 按 label 排序', () => {
    const files = all({
      'a.md': '# A',
      'z.md': '看 [[a]]',
      'm.md': '看 [[a]]',
    });
    const { incoming } = resolveRelated({ currentPath: 'a.md', allFiles: files });
    expect(incoming.map((r) => r.label)).toEqual(['m', 'z']);
  });

  it('basename 别名也算引用', () => {
    const files = all({
      'a.md': '# A',
      'b.md': '看 [[A]]',
    });
    const { incoming } = resolveRelated({ currentPath: 'a.md', allFiles: files });
    expect(incoming).toHaveLength(1);
    expect(incoming[0]?.path).toBe('b.md');
  });
});

describe('resolveRelated — 组合', () => {
  it('同一文档可同时 outgoing + 被别人 incoming', () => {
    const files = all({
      'a.md': '指向 [[b]]',
      'b.md': '指向 [[c]]',
      'c.md': '指向 [[a]] 形成环',
    });
    const r1 = resolveRelated({ currentPath: 'a.md', allFiles: files });
    expect(r1.outgoing.map((r) => r.path)).toEqual(['b.md']);
    expect(r1.incoming.map((r) => r.path)).toEqual(['c.md']);
  });

  it('空 allFiles 返回全空', () => {
    const r = resolveRelated({ currentPath: 'a.md', allFiles: [] });
    expect(r.outgoing).toEqual([]);
    expect(r.incoming).toEqual([]);
  });
});