import { describe, it, expect } from 'vitest';
import { extractHeadings, slugify } from './headings-extract';

describe('extractHeadings', () => {
  it('空字符串返回空数组', () => {
    expect(extractHeadings('')).toEqual([]);
  });

  it('提取 1-6 级 heading', () => {
    const md = `# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6\n`;
    const out = extractHeadings(md);
    expect(out.map((h) => h.level)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(out.map((h) => h.text)).toEqual(['H1', 'H2', 'H3', 'H4', 'H5', 'H6']);
  });

  it('忽略代码块内的井号', () => {
    const md = `# 真实标题\n\`\`\`\n# 这是代码块\n\`\`\`\n## 真实 h2\n`;
    const out = extractHeadings(md);
    expect(out.map((h) => h.text)).toEqual(['真实标题', '真实 h2']);
  });

  it('忽略行内代码的 #', () => {
    const md = '这是 # 不是标题\n# 真标题\n';
    const out = extractHeadings(md);
    expect(out).toHaveLength(1);
    expect(out[0]?.text).toBe('真标题');
  });

  it('支持关闭的 # 语法', () => {
    const md = `## 标题 ##\n`;
    const out = extractHeadings(md);
    expect(out).toHaveLength(1);
    expect(out[0]?.text).toBe('标题');
  });

  it('anchor 是 slug 化的 lowercase', () => {
    const md = `## Hello World\n`;
    const out = extractHeadings(md);
    expect(out[0]?.anchor).toBe('hello-world');
  });

  it('offset 指向原文中 # 的位置', () => {
    const md = `\n\n# Title\n`;
    const out = extractHeadings(md);
    expect(out[0]?.offset).toBe(2);
  });
});

describe('slugify', () => {
  it('小写化 + 空格转 -', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('支持中英文混排（保汉字）', () => {
    expect(slugify('第 1 章 介绍')).toBe('第-1-章-介绍');
  });

  it('去掉标点', () => {
    expect(slugify('What?!')).toBe('what');
  });
});