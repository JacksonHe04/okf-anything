'use client';

/**
 * FileTree — 文件树（完全重构为 Tailwind CSS，增加边距改善体验）。
 */

import { TreeNode } from './TreeNode';
import type { FileEntry } from '@/types/document';

type FileTreeProps = {
  topEntries: FileEntry[] | null;
  rootHandle: FileSystemDirectoryHandle | null;
  currentFilePath: string | null;
  onPickFile: (handle: FileSystemFileHandle, path: string) => void;
  onRename: (entry: FileEntry, entryPath: string, newTitle: string) => Promise<string>;
  onDelete: (entry: FileEntry, entryPath: string, parent: FileSystemDirectoryHandle) => Promise<void>;
  onCreateFile: (parent: FileSystemDirectoryHandle, parentPath: string, title: string) => Promise<void>;
  onCreateDir: (parent: FileSystemDirectoryHandle, parentPath: string, title: string) => Promise<void>;
  onCreateChild: (entry: FileEntry, entryPath: string, title: string) => Promise<void>;
  emptyMessage?: string;
};

export function FileTree(props: FileTreeProps) {
  const {
    topEntries,
    rootHandle,
    currentFilePath,
    onPickFile,
    onRename,
    onDelete,
    onCreateFile,
    onCreateDir,
    onCreateChild,
    emptyMessage,
  } = props;
  if (topEntries === null) {
    return <p className="text-xs text-fgMuted p-6 text-center font-sans">{emptyMessage ?? '尚未选择目录'}</p>;
  }
  if (topEntries.length === 0) {
    return <p className="text-xs text-fgMuted p-6 text-center font-sans">目录为空 (没有 .md 文件)</p>;
  }
  if (!rootHandle) return null;
  return (
    <ul className="pl-4 pr-3 py-2.5 space-y-0.5 list-none">
      {topEntries.map((e) => (
        <TreeNode
          key={e.name}
          entry={e}
          parentPath=""
          parentHandle={rootHandle}
          onPickFile={onPickFile}
          onRename={onRename}
          onDelete={onDelete}
          onCreateFile={onCreateFile}
          onCreateDir={onCreateDir}
          onCreateChild={onCreateChild}
          activePath={currentFilePath}
        />
      ))}
    </ul>
  );
}
