/**
 * Path allocator: in a parent directory, pick a non-conflicting
 * "Title.md" (file) or "Title/index.md" (dir).
 *
 * Conflicts are resolved by appending `-1`, `-2`, ... — case-insensitive
 * because macOS default filesystems are case-insensitive.
 */
import * as path from "path";

export interface PathAllocator {
  allocated: Set<string>;
  allocate(parentDir: string, title: string, kind: "file" | "dir"): string;
}

export function createPathAllocator(preallocated?: Iterable<string>): PathAllocator {
  const allocated = new Set<string>();
  if (preallocated) {
    for (const p of preallocated) allocated.add(p.toLowerCase());
  }
  return {
    allocated,
    allocate(parentDir, title, kind) {
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
