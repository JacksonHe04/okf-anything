'use client';

/**
 * MOON Page — 主编排。
 *
 * 三栏布局：左（Sidebar） · 中（Editor / Welcome） · 右（RightRail）
 * 顶栏：面包屑 · 搜索 · 主题切换 · 三点菜单
 *
 * 旧逻辑（File System Access / 自动保存 / 双链跳转 / 全文索引）全部保留。
 * 新布局用 design-system 的 Sidebar / SidebarItem / Breadcrumb / SearchInput / ThemeSwitcher 替换。
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDirectory } from '@/hooks/useDirectory';
import { useFileTree } from '@/hooks/useFileTree';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useSearchIndex } from '@/hooks/useSearchIndex';
import { useSidebarState } from '@/hooks/useSidebarState';
import { useBreadcrumb } from '@/hooks/useBreadcrumb';
import { useToc } from '@/hooks/useToc';
import { useRelatedDocs } from '@/hooks/useRelatedDocs';

import { FileTree } from '@/components/file-tree/FileTree';
import { Editor } from '@/components/editor/Editor';
import { RightRail } from '@/components/right-rail/RightRail';
import { Welcome } from '@/components/welcome/Welcome';
import { PromptDialog } from '@/components/file-tree/ContextMenu';
import { SearchPanel } from '@/components/search/SearchPanel';

import { Sidebar } from '@/design-system/components/composed/Sidebar';
import { SidebarItem } from '@/design-system/components/composed/SidebarItem';
import { Breadcrumb } from '@/design-system/components/composed/Breadcrumb';
import { SearchInput } from '@/design-system/components/composed/SearchInput';
import { ThemeSwitcher } from '@/design-system/components/composed/ThemeSwitcher';
import { WorkspaceSwitcher } from '@/design-system/components/composed/WorkspaceSwitcher';
import { Button } from '@/design-system/components/primitives/Button';
import { IconButton } from '@/design-system/components/primitives/IconButton';
import { Tooltip } from '@/design-system/components/primitives/Tooltip';
import { Menu, type MenuItem } from '@/design-system/components/primitives/Menu';

import { MoreHorizontal, FilePlus, FolderPlus, FileText, RefreshCw, Info } from 'lucide-react';

import { joinDocument } from '@/lib/markdown-serde';
import { getFileHandleByPath, scanMdFilesRecursively } from '@/lib/fs-access';
import { pushRecentFile, getRecentFiles } from '@/lib/recent-files';
import type { FileEntry, Frontmatter } from '@/types/document';

import '@/components/file-tree/file-tree.css';
import '@/components/editor/editor.css';
import '@/app/page.css';

export default function Page() {
  const { dirHandle, topEntries, status, errorMsg, pickDirectory, reauthorize } = useDirectory();
  const [currentFile, setCurrentFile] = useState<{ handle: FileSystemFileHandle; path: string } | null>(null);
  const [frontmatter, setFrontmatter] = useState<Frontmatter>({});
  const [bodyMd, setBodyMd] = useState('');
  const [dirty, setDirty] = useState(false);
  const [creatingFile, setCreatingFile] = useState(false);
  const [creatingDir, setCreatingDir] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allFileTexts, setAllFileTexts] = useState<{ path: string; text: string }[]>([]);
  const [recentPaths, setRecentPaths] = useState<string[]>([]);

  const leftSidebar = useSidebarState('left', false);
  const rightSidebar = useSidebarState('right', false);
  const search = useSearchIndex(dirHandle);

  // ─── 文件树 ─────────────────────────────────────────────
  const handlePickFile = useCallback((handle: FileSystemFileHandle, path: string) => {
    setCurrentFile({ handle, path });
    setDirty(false);
    pushRecentFile(path);
    setRecentPaths(getRecentFiles());
  }, []);

  const fileTree = useFileTree({
    rootHandle: dirHandle,
    onTreeChange: () => {},
    onOpenFile: (handle, path) => {
      setCurrentFile({ handle, path });
      setDirty(false);
      pushRecentFile(path);
      setRecentPaths(getRecentFiles());
    },
  });

  // ─── 初始化最近文件 ─────────────────────────────────────
  useEffect(() => {
    setRecentPaths(getRecentFiles());
  }, []);

  // ─── 自动保存 ───────────────────────────────────────────
  const saveFile = useCallback(async () => {
    if (!currentFile) return;
    const text = joinDocument(frontmatter, bodyMd);
    const writable = await currentFile.handle.createWritable();
    await writable.write(text);
    await writable.close();
    setDirty(false);
  }, [currentFile, frontmatter, bodyMd]);

  const autoSave = useAutoSave({ isDirty: dirty, save: saveFile });

  // ─── 加载所有文件文本（双链跳转 / 关联文档 / backlinks）──
  useEffect(() => {
    if (!dirHandle) {
      setAllFileTexts([]);
      return;
    }
    void (async () => {
      try {
        const files = await scanMdFilesRecursively(dirHandle);
        const out: { path: string; text: string }[] = [];
        for (const fileRef of files) {
          try {
            const file = await fileRef.handle.getFile();
            out.push({ path: fileRef.path, text: await file.text() });
          } catch {
            /* skip */
          }
        }
        setAllFileTexts(out);
      } catch (err) {
        console.error('加载所有文件文本失败:', err);
      }
    })();
  }, [dirHandle, currentFile]);

  // ─── 双链跳转 ──────────────────────────────────────────
  useEffect(() => {
    const handler = async (e: Event) => {
      const detail = (e as CustomEvent).detail as { href: string };
      if (!currentFile || !dirHandle) return;
      const allPaths = new Set(allFileTexts.map((f) => f.path));
      const resolved = (await import('@/lib/double-link')).resolveMdPath(
        currentFile.path,
        detail.href,
        allPaths,
      );
      if (!resolved) {
        window.alert(`链接目标不存在: ${detail.href}`);
        return;
      }
      try {
        const handle = await getFileHandleByPath(dirHandle, resolved);
        setCurrentFile({ handle, path: resolved });
        setDirty(false);
        pushRecentFile(resolved);
        setRecentPaths(getRecentFiles());
      } catch (err) {
        console.error('跳转失败:', err);
      }
    };
    window.addEventListener('double-link-click', handler);
    return () => window.removeEventListener('double-link-click', handler);
  }, [currentFile, dirHandle, allFileTexts]);

  // ─── 派生数据 ───────────────────────────────────────────
  const breadcrumbSegments = useBreadcrumb({
    relativePath: currentFile?.path ?? null,
    onNavigateTo: () => {
      // TODO: 跳到对应层级（暂时不实现，先保留接口）
    },
  });

  const headings = useToc(bodyMd);
  const related = useRelatedDocs(currentFile?.path ?? null, allFileTexts);

  // ─── 快捷键 ─────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 's') {
        e.preventDefault();
        autoSave.saveNow();
      }
      if (mod && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (mod && e.key === 'b') {
        e.preventDefault();
        leftSidebar.toggle();
      }
      if (mod && e.key === '.') {
        e.preventDefault();
        rightSidebar.toggle();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [autoSave, leftSidebar, rightSidebar]);

  // ─── 顶栏右侧 三点菜单 ──────────────────────────────────
  const moreMenuItems: MenuItem[] = useMemo(
    () => [
      {
        id: 'reload',
        label: '重新加载工作区',
        icon: <RefreshCw size={14} />,
        onSelect: () => {
          window.location.reload();
        },
      },
      { id: 'sep1', label: '', onSelect: () => {}, separatorAfter: true },
      {
        id: 'about',
        label: '关于 MOON',
        icon: <Info size={14} />,
        onSelect: () => window.open('https://github.com/JacksonHe04/moon-escape', '_blank'),
      },
    ],
    [],
  );

  const saveStatusLabel = useMemo(() => {
    switch (autoSave.status) {
      case 'saving':
        return '保存中…';
      case 'saved':
        return `已保存 ${autoSave.lastSavedAt?.toLocaleTimeString('zh-CN') ?? ''}`;
      case 'error':
        return `失败 ${autoSave.error ?? ''}`;
      case 'dirty':
        return '未保存';
      default:
        return '';
    }
  }, [autoSave]);

  const workspaceName = dirHandle?.name ?? null;

  return (
    <div className="moon-page">
      {/* ─── 顶栏 ────────────────────────────────────────── */}
      <header className="moon-topbar">
        <div className="moon-topbar-left">
          {currentFile ? (
            <Breadcrumb
              segments={breadcrumbSegments}
              root={
                <Tooltip label={workspaceName ?? '工作区'} side="bottom">
                  <FileText size={14} />
                </Tooltip>
              }
            />
          ) : (
            <span className="moon-topbar-status">未选择文件</span>
          )}
        </div>
        <div className="moon-topbar-right">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={(q) => {
              setSearchQuery(q);
              setSearchOpen(true);
            }}
            placeholder="搜索文档…"
          />
          {search.building && (
            <span className="moon-topbar-status">
              索引 {search.progress.done}/{search.progress.total}
            </span>
          )}
          {saveStatusLabel && (
            <span className="moon-topbar-status" data-state={autoSave.status}>
              {saveStatusLabel}
            </span>
          )}
          <ThemeSwitcher />
          <Menu
            trigger={
              <IconButton
                icon={<MoreHorizontal size={16} />}
                size="sm"
                aria-label="更多"
              />
            }
            items={moreMenuItems}
            align="end"
          />
        </div>
      </header>

      {/* ─── 左栏 ────────────────────────────────────────── */}
      <Sidebar side="left" collapsed={leftSidebar.collapsed} onToggleCollapsed={leftSidebar.toggle}>
        <WorkspaceSwitcher
          name={workspaceName}
          status={status}
          onPick={pickDirectory}
          onReauthorize={reauthorize}
        />
        <div className="moon-sidebar-file-list">
          <FileTree
            topEntries={topEntries}
            rootHandle={dirHandle}
            currentFilePath={currentFile?.path ?? null}
            onPickFile={handlePickFile}
            onRename={fileTree.rename}
            onDelete={(entry: FileEntry) =>
              dirHandle ? fileTree.remove(entry, dirHandle) : Promise.resolve()
            }
            onCreateFile={fileTree.createNewFile}
            onCreateDir={fileTree.createNewDir}
            emptyMessage={status === 'needs-reauth' ? '需要重新授权' : undefined}
          />
        </div>
        {dirHandle && (
          <div className="moon-sidebar-new-row">
            <Tooltip label="新建文件" side="top">
              <Button
                size="sm"
                iconLeft={<FilePlus size={14} />}
                onClick={() => setCreatingFile(true)}
              >
                文件
              </Button>
            </Tooltip>
            <Tooltip label="新建文件夹" side="top">
              <Button
                size="sm"
                iconLeft={<FolderPlus size={14} />}
                onClick={() => setCreatingDir(true)}
              >
                文件夹
              </Button>
            </Tooltip>
          </div>
        )}
      </Sidebar>

      {/* ─── 主区 ────────────────────────────────────────── */}
      <main className="moon-main">
        {currentFile ? (
          <div className="moon-editor-wrap">
            <Editor
              fileHandle={currentFile.handle}
              filePath={currentFile.path}
              onDirtyChange={setDirty}
              onFrontmatterChange={(fm) => setFrontmatter(fm as Frontmatter)}
              onBodyChange={setBodyMd}
            />
          </div>
        ) : (
          <Welcome
            recentPaths={recentPaths}
            hasWorkspace={Boolean(dirHandle)}
            onPickRecent={(path) => {
              if (!dirHandle) return;
              void (async () => {
                try {
                  const handle = await getFileHandleByPath(dirHandle, path);
                  handlePickFile(handle, path);
                } catch (err) {
                  console.error('打开最近文件失败:', err);
                }
              })();
            }}
          />
        )}
      </main>

      {/* ─── 右栏 ────────────────────────────────────────── */}
      <Sidebar side="right" collapsed={rightSidebar.collapsed} onToggleCollapsed={rightSidebar.toggle}>
        {currentFile && (
          <RightRail
            fileHandle={currentFile.handle}
            currentPath={currentFile.path}
            allFileTexts={allFileTexts}
            onFrontmatterChange={(fm) => setFrontmatter(fm)}
            headings={headings}
            onJumpToHeading={(h) => {
              // TODO: 让 Tiptap 滚到对应 offset
              console.log('jump to heading:', h.text);
            }}
            related={related}
            onOpenRelated={(path) => {
              if (!dirHandle) return;
              void (async () => {
                try {
                  const handle = await getFileHandleByPath(dirHandle, path);
                  handlePickFile(handle, path);
                } catch (err) {
                  console.error('打开关联文档失败:', err);
                }
              })();
            }}
          />
        )}
      </Sidebar>

      {/* ─── Modals ──────────────────────────────────────── */}
      {creatingFile && dirHandle && (
        <PromptDialog
          title="新建文件 (在根目录)"
          onConfirm={async () => {
            await fileTree.createNewFile(dirHandle, dirHandle.name);
            setCreatingFile(false);
          }}
          onCancel={() => setCreatingFile(false)}
        />
      )}
      {creatingDir && dirHandle && (
        <PromptDialog
          title="新建文件夹 (在根目录)"
          onConfirm={async () => {
            await fileTree.createNewDir(dirHandle);
            setCreatingDir(false);
          }}
          onCancel={() => setCreatingDir(false)}
        />
      )}
      {searchOpen && (
        <SearchPanel
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          search={(q) => {
            // 让 SearchPanel 内部用 useSearchIndex 的 search
            return search.search(q);
          }}
          onPick={async (r) => {
            if (!dirHandle) return;
            try {
              const handle = await getFileHandleByPath(dirHandle, r.path);
              handlePickFile(handle, r.path);
              setSearchOpen(false);
            } catch (err) {
              console.error('打开搜索结果失败:', err);
            }
          }}
        />
      )}

      {errorMsg && (
        <div className="moon-topbar-status" data-state="error" style={{ position: 'fixed', bottom: 12, right: 12 }}>
          {errorMsg}
        </div>
      )}
    </div>
  );
}