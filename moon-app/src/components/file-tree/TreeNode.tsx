'use client';

/**
 * TreeNode — 文件树节点（完全重构为 Tailwind CSS，并统一使用 Lucide 图标）。
 */

import { useCallback, useState } from 'react';
import { readDirectoryEntries } from '@/lib/fs-access';
import type { FileEntry } from '@/types/document';
import { ContextMenu, PromptDialog, ConfirmDialog } from './ContextMenu';
import { Folder, FolderOpen, FileText } from 'lucide-react';

type TreeNodeProps = {
  entry: FileEntry;
  parentPath: string;
  parentHandle: FileSystemDirectoryHandle;
  onPickFile: (handle: FileSystemFileHandle, path: string) => void;
  onRename: (entry: FileEntry, entryPath: string, newTitle: string) => Promise<string>;
  onDelete: (entry: FileEntry, entryPath: string, parent: FileSystemDirectoryHandle) => Promise<void>;
  onCreateFile: (parent: FileSystemDirectoryHandle, parentPath: string, title: string) => Promise<void>;
  onCreateDir: (parent: FileSystemDirectoryHandle, parentPath: string, title: string) => Promise<void>;
  onCreateChild: (entry: FileEntry, entryPath: string, title: string) => Promise<void>;
  activePath: string | null;
};

export function TreeNode(props: TreeNodeProps) {
  const {
    entry,
    parentPath,
    parentHandle,
    onPickFile,
    onRename,
    onDelete,
    onCreateFile,
    onCreateDir,
    onCreateChild,
    activePath,
  } = props;
  const [open, setOpen] = useState(false);
  const [kids, setKids] = useState<FileEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [creatingFile, setCreatingFile] = useState(false);
  const [creatingDir, setCreatingDir] = useState(false);
  const [creatingChild, setCreatingChild] = useState(false);

  const path = parentPath ? `${parentPath}/${entry.name}` : entry.name;

  const toggle = useCallback(async () => {
    if (entry.kind !== 'dir') return;
    if (!open && kids === null) {
      setLoading(true);
      try {
        const k = await readDirectoryEntries(entry.handle as FileSystemDirectoryHandle);
        setKids(k);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    } else {
      setOpen(!open);
    }

    try {
      const dirHandle = entry.handle as FileSystemDirectoryHandle;
      const indexHandle = await dirHandle.getFileHandle('index.md');
      onPickFile(indexHandle, `${path}/index.md`);
    } catch (err) {
      // index.md doesn't exist
    }
  }, [entry.handle, entry.kind, kids, open, onPickFile, path]);

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY });
  };

  if (entry.kind === 'dir') {
    const dirHandle = entry.handle as FileSystemDirectoryHandle;
    const isDirActive = activePath === `${path}/index.md`;
    return (
      <li className="list-none">
        <div
          className={`flex items-center gap-2 py-1 px-2.5 cursor-pointer rounded transition-colors duration-120 text-[13px] font-sans font-medium select-none ${
            isDirActive
              ? 'bg-accentMuted text-accent'
              : 'text-fg hover:bg-sidebarHoverBg'
          }`}
          onClick={toggle}
          onContextMenu={onContextMenu}
        >
          <span className={`flex-shrink-0 ${isDirActive ? 'text-accent' : 'text-accent/80'}`}>
            {open ? <FolderOpen size={15} /> : <Folder size={15} />}
          </span>
          <span className="truncate">{entry.title ?? entry.name}</span>
        </div>
        {open && kids && (
          <ul className="pl-3.5 list-none border-l border-borderSubtle/60 ml-4 mb-0.5 space-y-0.5">
            {kids.map((k) => (
              <TreeNode
                key={k.name}
                entry={k}
                parentPath={path}
                parentHandle={dirHandle}
                onPickFile={onPickFile}
                onRename={onRename}
                onDelete={onDelete}
                onCreateFile={onCreateFile}
                onCreateDir={onCreateDir}
                onCreateChild={onCreateChild}
                activePath={activePath}
              />
            ))}
          </ul>
        )}
        {loading && <div className="text-[11px] text-fgMuted pl-6 font-sans">加载中…</div>}
        {menu && (
          <ContextMenu
            x={menu.x} y={menu.y}
            onClose={() => setMenu(null)}
            actions={[
              { label: '在此新建文件', onClick: () => setCreatingFile(true) },
              { label: '在此新建文件夹', onClick: () => setCreatingDir(true) },
              { label: '重命名', onClick: () => setRenaming(true) },
              { label: '删除', onClick: () => setConfirmingDelete(true), danger: true },
            ]}
          />
        )}
        {renaming && (
          <PromptDialog
            title={`重命名 "${entry.name}"`}
            defaultValue={entry.title ?? entry.name}
            onConfirm={async (v) => { await onRename(entry, path, v); setRenaming(false); }}
            onCancel={() => setRenaming(false)}
          />
        )}
        {confirmingDelete && (
          <ConfirmDialog
            title={`删除 "${entry.name}"?`}
            message="将删除整个文件夹及其所有内容,操作不可撤销。"
            onConfirm={async () => { await onDelete(entry, path, parentHandle); setConfirmingDelete(false); }}
            onCancel={() => setConfirmingDelete(false)}
          />
        )}
        {creatingFile && (
          <PromptDialog
            title={`在 ${entry.name}/ 新建文件`}
            onConfirm={async (v) => { await onCreateFile(dirHandle, path, v); setCreatingFile(false); }}
            onCancel={() => setCreatingFile(false)}
          />
        )}
        {creatingDir && (
          <PromptDialog
            title={`在 ${entry.name}/ 新建文件夹`}
            onConfirm={async (v) => { await onCreateDir(dirHandle, path, v); setCreatingDir(false); }}
            onCancel={() => setCreatingDir(false)}
          />
        )}
      </li>
    );
  }

  const isActive = activePath === path;
  return (
    <li className="list-none">
      <div
        className={`flex items-center gap-2 py-1 px-2.5 cursor-pointer rounded transition-colors duration-120 text-[13px] font-sans select-none ${
          isActive
            ? 'bg-accentMuted text-accent font-medium'
            : 'text-fg hover:bg-sidebarHoverBg'
        }`}
        onClick={() => onPickFile(entry.handle as FileSystemFileHandle, path)}
        onContextMenu={onContextMenu}
        title={path}
      >
        <span className="flex-shrink-0 text-fgMuted">
          <FileText size={15} className={isActive ? 'text-accent' : 'text-fgMuted'} />
        </span>
        <span className="truncate">{entry.title ?? entry.name.replace(/\.md$/i, '')}</span>
      </div>
      {menu && (
        <ContextMenu
          x={menu.x} y={menu.y}
          onClose={() => setMenu(null)}
          actions={[
            { label: '新增子文档', onClick: () => setCreatingChild(true) },
            { label: '重命名', onClick: () => setRenaming(true) },
            { label: '删除', onClick: () => setConfirmingDelete(true), danger: true },
          ]}
        />
      )}
      {renaming && (
        <PromptDialog
          title={`重命名 "${entry.name}"`}
          defaultValue={entry.title ?? entry.name.replace(/\.md$/, '')}
          onConfirm={async (v) => { await onRename(entry, path, v); setRenaming(false); }}
          onCancel={() => setRenaming(false)}
        />
      )}
      {confirmingDelete && (
        <ConfirmDialog
          title={`删除 "${entry.name}"?`}
          message="操作不可撤销。"
          onConfirm={async () => { await onDelete(entry, path, parentHandle); setConfirmingDelete(false); }}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
      {creatingChild && (
        <PromptDialog
          title={`在 ${entry.title ?? entry.name} 下新增子文档`}
          onConfirm={async (v) => { await onCreateChild(entry, path, v); setCreatingChild(false); }}
          onCancel={() => setCreatingChild(false)}
        />
      )}
    </li>
  );
}
