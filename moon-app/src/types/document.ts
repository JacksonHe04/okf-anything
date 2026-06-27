// 文档与文件树类型
export type Frontmatter = Record<string, unknown>;

export type FileEntry = {
  kind: 'dir' | 'file';
  name: string;
  path: string;
  handle: FileSystemDirectoryHandle | FileSystemFileHandle;
  title?: string;
  children?: FileEntry[];
};

export type OpenFile = {
  handle: FileSystemFileHandle;
  path: string;
  frontmatter: Frontmatter;
  body: string;
  dirty: boolean;
  lastSavedAt: Date | null;
};
