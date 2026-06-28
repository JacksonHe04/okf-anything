'use client';

/**
 * TreeNode — 文件树节点
 * - 统一使用文档图标（文件夹和文件都是文档）
 * - 展开/折叠图标仅在 hover 时显示
 * - hover 时文档图标替换为展开/折叠图标
 * - 直角折线和稍大间距使子文档更明显
 */

import { useCallback, useState } from 'react';
import { readDirectoryEntries } from '@/lib/fs-access';
import type { FileEntry } from '@/types/document';
import { ContextMenu, PromptDialog, ConfirmDialog } from './ContextMenu';
import { FileText, ChevronRight, ChevronDown } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

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
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [kids, setKids] = useState<FileEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [creatingFile, setCreatingFile] = useState(false);
  const [creatingDir, setCreatingDir] = useState(false);
  const [creatingChild, setCreatingChild] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const path = parentPath ? `${parentPath}/${entry.name}` : entry.name;
  const isDir = entry.kind === 'dir';
  const isActive = activePath === path || (isDir && activePath === `${path}/index.md`);

  // 展开/折叠操作（仅触发展开，不打开文件）
  const handleToggle = useCallback(async () => {
    if (!isDir) return;
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
  }, [isDir, entry.handle, open, kids]);

  // 打开文件操作
  const handleOpen = useCallback(() => {
    if (isDir) {
      // 有子节点时，先尝试打开 index.md
      const dirHandle = entry.handle as FileSystemDirectoryHandle;
      void (async () => {
        try {
          const indexHandle = await dirHandle.getFileHandle('index.md');
          onPickFile(indexHandle, `${path}/index.md`);
        } catch {
          // index.md 不存在，不做任何操作
        }
      })();
    } else {
      onPickFile(entry.handle as FileSystemFileHandle, path);
    }
  }, [isDir, entry.handle, path, onPickFile]);

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY });
  };

  // 基础行样式
  const rowClasses = `group flex items-center gap-1.5 py-1 pr-2 cursor-pointer rounded text-[13px] font-sans select-none transition-colors duration-120 ${
    isActive
      ? 'bg-accentMuted text-accent'
      : 'text-fg hover:bg-sidebarHoverBg'
  }`;

  return (
    <li className="list-none">
      {/* 主行 */}
      <div
        className={rowClasses}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onContextMenu={onContextMenu}
      >
        {/* 展开/折叠图标区域 - 仅目录显示，且仅 hover 时显示展开图标 */}
        <span className="w-5 flex-shrink-0 flex items-center justify-center">
          {isDir && (
            <span
              className={`transition-opacity duration-150 ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {open ? (
                <ChevronDown size={15} className={isActive ? 'text-accent' : 'text-fgMuted'} />
              ) : (
                <ChevronRight size={15} className={isActive ? 'text-accent' : 'text-fgMuted'} />
              )}
            </span>
          )}
        </span>

        {/* 文档图标 - hover 时显示展开图标，替换文档图标 */}
        <span
          className={`flex-shrink-0 transition-all duration-150 ${
            isActive ? 'text-accent' : 'text-fgMuted'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            if (isDir && isHovered) {
              handleToggle();
            } else if (isDir) {
              // 非 hover 状态下点击图标，尝试打开 index.md
              handleOpen();
            } else {
              // 文件直接打开
              handleOpen();
            }
          }}
        >
          {isDir && isHovered ? (
            open ? (
              <ChevronDown size={15} />
            ) : (
              <ChevronRight size={15} />
            )
          ) : (
            <FileText size={15} />
          )}
        </span>

        {/* 文档名称 */}
        <span
          className="truncate flex-1"
          onClick={handleOpen}
        >
          {entry.title ?? entry.name.replace(/\.md$/i, '')}
        </span>
      </div>

      {/* 子文档 - 直角折线 + 稍大间距 */}
      {open && kids && kids.length > 0 && (
        <ul className="pl-6 list-none border-l-2 border-borderSubtle ml-2.5 my-0.5 space-y-0.5">
          {kids.map((k) => (
            <TreeNode
              key={k.name}
              entry={k}
              parentPath={path}
              parentHandle={entry.handle as FileSystemDirectoryHandle}
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
      {loading && <div className="text-[11px] text-fgMuted pl-10 font-sans">{t('loading')}</div>}

      {/* 右键菜单 */}
      {menu && (
        <ContextMenu
          x={menu.x} y={menu.y}
          onClose={() => setMenu(null)}
          actions={
            isDir
              ? [
                  { label: t('newFileHere'), onClick: () => setCreatingFile(true) },
                  { label: t('newFolderHere'), onClick: () => setCreatingDir(true) },
                  { label: t('rename'), onClick: () => setRenaming(true) },
                  { label: t('delete'), onClick: () => setConfirmingDelete(true), danger: true },
                ]
              : [
                  { label: t('newSubDoc'), onClick: () => setCreatingChild(true) },
                  { label: t('rename'), onClick: () => setRenaming(true) },
                  { label: t('delete'), onClick: () => setConfirmingDelete(true), danger: true },
                ]
          }
        />
      )}

      {/* 重命名弹窗 */}
      {renaming && (
        <PromptDialog
          title={t('renameTitle').replace('{name}', entry.name)}
          defaultValue={entry.title ?? (isDir ? entry.name : entry.name.replace(/\.md$/i, ''))}
          onConfirm={async (v) => { await onRename(entry, path, v); setRenaming(false); }}
          onCancel={() => setRenaming(false)}
        />
      )}

      {/* 删除确认弹窗 */}
      {confirmingDelete && (
        <ConfirmDialog
          title={t('deleteTitle').replace('{name}', entry.name)}
          message={isDir ? t('confirmDeleteText') : t('confirmDeleteTextSingle')}
          onConfirm={async () => { await onDelete(entry, path, parentHandle); setConfirmingDelete(false); }}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}

      {/* 新建文件弹窗 */}
      {creatingFile && (
        <PromptDialog
          title={t('newFileIn').replace('{name}', entry.name)}
          onConfirm={async (v) => { await onCreateFile(entry.handle as FileSystemDirectoryHandle, path, v); setCreatingFile(false); }}
          onCancel={() => setCreatingFile(false)}
        />
      )}

      {/* 新建文件夹弹窗 */}
      {creatingDir && (
        <PromptDialog
          title={t('newFolderIn').replace('{name}', entry.name)}
          onConfirm={async (v) => { await onCreateDir(entry.handle as FileSystemDirectoryHandle, path, v); setCreatingDir(false); }}
          onCancel={() => setCreatingDir(false)}
        />
      )}

      {/* 新建子文档弹窗 */}
      {creatingChild && (
        <PromptDialog
          title={t('newSubDocIn').replace('{name}', entry.title ?? entry.name)}
          onConfirm={async (v) => { await onCreateChild(entry, path, v); setCreatingChild(false); }}
          onCancel={() => setCreatingChild(false)}
        />
      )}
    </li>
  );
}