'use client';

import { useCallback } from 'react';
import {
  readDirectoryEntries,
  createFile,
  createDir,
  renameEntry,
  deleteEntry,
  generateUniqueFilename,
  slugify,
} from '@/lib/fs-access';

type UseFileTreeParams = {
  rootHandle: FileSystemDirectoryHandle | null;
  onTreeChange: () => void;
  onOpenFile: (handle: FileSystemFileHandle, path: string) => void;
};

export function useFileTree({ rootHandle, onTreeChange, onOpenFile }: UseFileTreeParams) {
  const refresh = useCallback(async () => {
    if (!rootHandle) return;
    return await readDirectoryEntries(rootHandle);
  }, [rootHandle]);

  const createNewFile = useCallback(
    async (parent: FileSystemDirectoryHandle, parentName: string): Promise<void> => {
      const title = window.prompt('新文件标题') ?? '';
      if (!title.trim()) return;
      const base = slugify(title) + '.md';
      const existingNames = new Set<string>();
      for await (const [name] of parent.entries()) existingNames.add(name);
      const filename = generateUniqueFilename(base, (n) => existingNames.has(n));
      const content = `---\ntype: Local Page\ntitle: ${title}\nnotion_id: local-${crypto.randomUUID()}\n---\n\n`;
      const handle = await createFile(parent, filename, content);
      onTreeChange();
      onOpenFile(handle, `${parentName}/${filename}`);
    },
    [onTreeChange, onOpenFile],
  );

  const createNewDir = useCallback(
    async (parent: FileSystemDirectoryHandle) => {
      const name = window.prompt('新文件夹名') ?? '';
      if (!name.trim()) return;
      await createDir(parent, slugify(name));
      onTreeChange();
    },
    [onTreeChange],
  );

  const rename = useCallback(
    async (entry: { kind: 'dir' | 'file'; name: string; handle: FileSystemDirectoryHandle | FileSystemFileHandle }, newTitle: string) => {
      const newName = entry.kind === 'file' ? slugify(newTitle) + '.md' : slugify(newTitle);
      if (newName === entry.name) return;
      await renameEntry(entry.handle, newName);
      onTreeChange();
    },
    [onTreeChange],
  );

  const remove = useCallback(
    async (entry: { name: string }, parent: FileSystemDirectoryHandle) => {
      await deleteEntry(parent, entry.name);
      onTreeChange();
    },
    [onTreeChange],
  );

  return { refresh, createNewFile, createNewDir, rename, remove };
}
