/**
 * 路径分配: 在父目录下申请一条不冲突的本地路径
 *
 * - file: 叶子节点, 直接命名 `Title.md`
 * - dir:  非叶子节点, 创建 `Title/index.md`
 *
 * 冲突时追加 `-1`, `-2`... 后缀 (case-insensitive, 因为 macOS HFS+/APFS 默认大小写不敏感)
 */
import * as path from "path";

export interface PathAllocator {
  /** 已占用的路径集合 (建议预填磁盘上已存在的 .md) */
  allocated: Set<string>;
  /** 相对 baseDir 的最终路径. file 形如 "a/b.md", dir 形如 "a/b/index.md" */
  allocate(parentDir: string, title: string, kind: "file" | "dir"): string;
}

export function createPathAllocator(preallocated?: Iterable<string>): PathAllocator {
  const allocated = new Set<string>();
  if (preallocated) {
    for (const p of preallocated) allocated.add(p.toLowerCase());
  }
  return {
    allocated,
    allocate(parentDir: string, title: string, kind: "file" | "dir"): string {
      if (kind === "file") {
        let fileName = title;
        let target = path.join(parentDir, `${fileName}.md`);
        let attempt = 1;
        while (allocated.has(target.toLowerCase())) {
          fileName = `${title}-${attempt}`;
          target = path.join(parentDir, `${fileName}.md`);
          attempt++;
        }
        allocated.add(target.toLowerCase());
        return target;
      }
      let dirName = title;
      let targetDir = path.join(parentDir, dirName);
      let attempt = 1;
      while (allocated.has(targetDir.toLowerCase())) {
        dirName = `${title}-${attempt}`;
        targetDir = path.join(parentDir, dirName);
        attempt++;
      }
      allocated.add(targetDir.toLowerCase());
      return path.join(targetDir, "index.md");
    },
  };
}