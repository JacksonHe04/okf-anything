'use client';

/**
 * MOON Page — 主编排（完全重构为 Tailwind CSS，支持文件绝对路径 URL 同步及侧栏优化）。
 *
 * 三栏布局：左（Sidebar） · 中（Editor / Welcome） · 右（RightRail）
 * 顶栏：面包屑 · 搜索 · 主题切换 · 三点菜单
 *
 * 左侧栏底部的两个按钮已居中，仅显示 icon。左侧栏占满高度，顶栏移到右侧内容区域。
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
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
import { Breadcrumb } from '@/design-system/components/composed/Breadcrumb';
import { ThemeSwitcher } from '@/design-system/components/composed/ThemeSwitcher';
import { WorkspaceSwitcher } from '@/design-system/components/composed/WorkspaceSwitcher';
import { IconButton } from '@/design-system/components/primitives/IconButton';
import { Tooltip } from '@/design-system/components/primitives/Tooltip';
import { Menu, type MenuItem } from '@/design-system/components/primitives/Menu';

import { MoreHorizontal, FilePlus, FolderPlus, FileText, RefreshCw, Info, Search } from 'lucide-react';

import { joinDocument } from '@/lib/markdown-serde';
import { composeDocument } from '@/lib/frontmatter';
import {
  deslugify,
  generateUniqueFilename,
  getBasename,
  getDirectoryHandleByPath,
  getFileHandleByPath,
  getParentPath,
  renameEntry,
  scanMdFilesRecursively,
  slugify,
} from '@/lib/fs-access';
import { pushRecentFile, getRecentFiles } from '@/lib/recent-files';
import type { FileEntry, Frontmatter } from '@/types/document';
import { useI18n } from '@/lib/i18n';

export default function Page() {
  const { locale, setLocale, t } = useI18n();
  const { dirHandle, topEntries, status, errorMsg, pickDirectory, reauthorize, refreshEntries } = useDirectory();
  const [currentFile, setCurrentFile] = useState<{ handle: FileSystemFileHandle; path: string } | null>(null);
  const [frontmatter, setFrontmatter] = useState<Frontmatter>({});
  const [bodyMd, setBodyMd] = useState('');
  const [originalFrontmatterText, setOriginalFrontmatterText] = useState('');
  const [frontmatterDirty, setFrontmatterDirty] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [creatingFile, setCreatingFile] = useState(false);
  const [creatingDir, setCreatingDir] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [allFileTexts, setAllFileTexts] = useState<{ path: string; text: string }[]>([]);
  const [recentPaths, setRecentPaths] = useState<string[]>([]);
  const [workspaceRoot, setWorkspaceRoot] = useState<string | null>(null);
  const [treeVersion, setTreeVersion] = useState(0);
  const [editorInstance, setEditorInstance] = useState<import('@tiptap/react').Editor | null>(null);

  const syncPathToHistory = useCallback(
    (path: string) => {
      if (workspaceRoot && dirHandle) {
        const absolutePath = `${workspaceRoot}/${dirHandle.name}/${path}`;
        window.history.pushState(null, '', `/home${absolutePath}`);
      } else {
        window.history.pushState(null, '', `/home/${path}`);
      }
    },
    [dirHandle, workspaceRoot],
  );

  const leftSidebar = useSidebarState('left', false);
  const rightSidebar = useSidebarState('right', false);
  const search = useSearchIndex(dirHandle);
  const pathname = usePathname();

  // 获取工作区在计算机上的绝对路径
  useEffect(() => {
    fetch('/api/workspace')
      .then((res) => res.json())
      .then((data) => setWorkspaceRoot(data.workspaceRoot))
      .catch((err) => console.error('获取工作区绝对路径失败:', err));
  }, []);

  // ─── 文件选择 ─────────────────────────────────────────────
  const handlePickFile = useCallback((handle: FileSystemFileHandle, path: string) => {
    setCurrentFile({ handle, path });
    setDirty(false);
    setFrontmatterDirty(false);
    setOriginalFrontmatterText('');
    pushRecentFile(path);
    setRecentPaths(getRecentFiles());

    // 同步更新 URL 为用户计算机的绝对路径
    syncPathToHistory(path);
  }, [syncPathToHistory]);

  const fileTree = useFileTree({
    rootHandle: dirHandle,
    onTreeChange: () => {
      void refreshEntries();
      setTreeVersion((v) => v + 1);
    },
    onOpenFile: handlePickFile,
  });

  const handleRenameEntry = useCallback(
    async (entry: FileEntry, entryPath: string, newTitle: string) => {
      if (!dirHandle) return entryPath;
      const renamedPath = await fileTree.rename(entry, entryPath, newTitle);
      if (!currentFile) return renamedPath;

      let nextOpenPath: string | null = null;
      if (entry.kind === 'file' && currentFile.path === entryPath) {
        nextOpenPath = renamedPath;
      }
      if (entry.kind === 'dir') {
        const oldDirPrefix = `${entryPath}/`;
        const newDirPrefix = `${renamedPath.slice(0, -'/index.md'.length)}/`;
        if (currentFile.path === `${entryPath}/index.md`) {
          nextOpenPath = renamedPath;
        } else if (currentFile.path.startsWith(oldDirPrefix)) {
          nextOpenPath = currentFile.path.replace(oldDirPrefix, newDirPrefix);
        }
      }

      if (nextOpenPath) {
        const handle = await getFileHandleByPath(dirHandle, nextOpenPath);
        setCurrentFile({ handle, path: nextOpenPath });
        pushRecentFile(nextOpenPath);
        setRecentPaths(getRecentFiles());
        syncPathToHistory(nextOpenPath);
      }
      return renamedPath;
    },
    [currentFile, dirHandle, fileTree, syncPathToHistory],
  );

  const handleDeleteEntry = useCallback(
    async (entry: FileEntry, entryPath: string, parent: FileSystemDirectoryHandle) => {
      await fileTree.remove(entry, parent);
      if (!currentFile) return;
      const currentPath = currentFile.path;
      const deletedDocPath = entry.kind === 'dir' ? `${entryPath}/index.md` : entryPath;
      const deletedPrefix = `${entryPath}/`;
      if (currentPath === deletedDocPath || (entry.kind === 'dir' && currentPath.startsWith(deletedPrefix))) {
        setCurrentFile(null);
        setBodyMd('');
        setFrontmatter({});
        setFrontmatterDirty(false);
        setDirty(false);
        setOriginalFrontmatterText('');
        window.history.pushState(null, '', '/home');
      }
    },
    [currentFile, fileTree],
  );

  // ─── 监听 URL 变化并自动打开对应文件 ─────────────────────────────
  useEffect(() => {
    if (status !== 'ready' || !dirHandle || !workspaceRoot) return;
    if (!pathname || !pathname.startsWith('/home/')) {
      if (currentFile !== null) {
        setCurrentFile(null);
      }
      return;
    }

    // 从 URL 中提取用户计算机上的绝对路径
    const targetAbsolutePath = decodeURIComponent(pathname.substring(6)); // 去除 "/home" 前缀

    // 当前工作区的绝对路径前缀
    const dirAbsolutePrefix = `${workspaceRoot}/${dirHandle.name}`;

    // 检查绝对路径是否属于当前工作区
    if (!targetAbsolutePath.startsWith(dirAbsolutePrefix + '/')) {
      return;
    }

    // 提取相对路径并加载文件
    const targetRelativePath = targetAbsolutePath.substring(dirAbsolutePrefix.length + 1);
    if (currentFile?.path === targetRelativePath) return;

    void (async () => {
      try {
        const handle = await getFileHandleByPath(dirHandle, targetRelativePath);
        setCurrentFile({ handle, path: targetRelativePath });
        setDirty(false);
        setFrontmatterDirty(false);
        setOriginalFrontmatterText('');
      } catch (err) {
        console.error('根据绝对路径 URL 自动打开文件失败:', err);
        window.history.pushState(null, '', '/home');
      }
    })();
  }, [dirHandle, status, pathname, currentFile?.path, workspaceRoot]);

  // ─── 初始化最近文件 ─────────────────────────────────────
  useEffect(() => {
    setRecentPaths(getRecentFiles());
  }, []);

  // ─── 自动保存 ───────────────────────────────────────────
  const saveFile = useCallback(async () => {
    if (!currentFile || !dirHandle) return;
    let targetFile = currentFile;
    const nextTitle = typeof frontmatter.title === 'string' ? frontmatter.title.trim() : '';

    if (nextTitle) {
      const desiredSlug = slugify(nextTitle);
      if (currentFile.path.endsWith('/index.md')) {
        const dirPath = currentFile.path.slice(0, -'/index.md'.length);
        const currentDirName = getBasename(dirPath);
        if (desiredSlug && desiredSlug !== currentDirName) {
          const parentPath = getParentPath(dirPath);
          const parentDir = parentPath ? await getDirectoryHandleByPath(dirHandle, parentPath) : dirHandle;
          const existingNames = new Set<string>();
          for await (const [name] of parentDir.entries()) {
            if (name !== currentDirName) existingNames.add(name);
          }
          const nextDirName = generateUniqueFilename(desiredSlug, (name) => existingNames.has(name));
          const dirHandleToRename = await getDirectoryHandleByPath(dirHandle, dirPath);
          await renameEntry(dirHandleToRename, nextDirName);
          const renamedDirPath = parentPath ? `${parentPath}/${nextDirName}` : nextDirName;
          targetFile = {
            handle: await getFileHandleByPath(dirHandle, `${renamedDirPath}/index.md`),
            path: `${renamedDirPath}/index.md`,
          };
        }
      } else {
        const currentName = getBasename(currentFile.path);
        const desiredFilename = `${desiredSlug}.md`;
        if (desiredSlug && desiredFilename !== currentName) {
          const parentPath = getParentPath(currentFile.path);
          const parentDir = parentPath ? await getDirectoryHandleByPath(dirHandle, parentPath) : dirHandle;
          const existingNames = new Set<string>();
          for await (const [name] of parentDir.entries()) {
            if (name !== currentName) existingNames.add(name);
          }
          const nextFilename = generateUniqueFilename(desiredFilename, (name) => existingNames.has(name));
          await renameEntry(currentFile.handle, nextFilename);
          targetFile = {
            handle: await getFileHandleByPath(
              dirHandle,
              parentPath ? `${parentPath}/${nextFilename}` : nextFilename,
            ),
            path: parentPath ? `${parentPath}/${nextFilename}` : nextFilename,
          };
        }
      }
    }

    // 关键：仅在 frontmatter 被用户编辑（frontmatterDirty）时重新序列化 YAML，
    // 否则保留原始 frontmatter 文本（引号、顺序、注释等不被破坏）。
    const text = frontmatterDirty
      ? joinDocument(frontmatter, bodyMd)
      : composeDocument(originalFrontmatterText, bodyMd);
    const writable = await targetFile.handle.createWritable();
    await writable.write(text);
    await writable.close();
    if (targetFile.path !== currentFile.path) {
      setCurrentFile(targetFile);
      pushRecentFile(targetFile.path);
      setRecentPaths(getRecentFiles());
      syncPathToHistory(targetFile.path);
    }
    await refreshEntries();
    setTreeVersion((v) => v + 1);
    setDirty(false);
  }, [
    bodyMd,
    currentFile,
    dirHandle,
    frontmatter,
    frontmatterDirty,
    originalFrontmatterText,
    refreshEntries,
    syncPathToHistory,
  ]);

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
  }, [dirHandle, currentFile, treeVersion]);

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
        handlePickFile(handle, resolved);
      } catch (err) {
        console.error('跳转失败:', err);
      }
    };
    window.addEventListener('double-link-click', handler);
    return () => window.removeEventListener('double-link-click', handler);
  }, [currentFile, dirHandle, allFileTexts, handlePickFile]);

  // ─── 面包屑跳转 index.md ───────────────────────────────────────────
  const breadcrumbSegments = useBreadcrumb({
    relativePath: currentFile?.path ?? null,
    onNavigateTo: (idx, label) => {
      if (!currentFile || !dirHandle) return;
      const parts = currentFile.path.split('/').filter(Boolean);
      // 取点击层级之前的文件夹路径
      const targetFolderPath = parts.slice(0, idx + 1).join('/');
      const targetIndexPath = `${targetFolderPath}/index.md`;
      void (async () => {
        try {
          const handle = await getFileHandleByPath(dirHandle, targetIndexPath);
          handlePickFile(handle, targetIndexPath);
        } catch (err) {
          console.warn('面包屑目录中不存在 index.md:', err);
        }
      })();
    },
  });

  const headings = useToc(bodyMd);
  const related = useRelatedDocs(currentFile?.path ?? null, allFileTexts);
  const documentTitle = useMemo(() => {
    if (typeof frontmatter.title === 'string' && frontmatter.title.trim()) {
      return frontmatter.title;
    }
    if (!currentFile) return '';
    if (currentFile.path.endsWith('/index.md')) {
      return deslugify(getBasename(currentFile.path.slice(0, -'/index.md'.length)));
    }
    return deslugify(getBasename(currentFile.path).replace(/\.md$/i, ''));
  }, [currentFile, frontmatter.title]);

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
        label: t('reloadWorkspace'),
        icon: <RefreshCw size={14} />,
        onSelect: () => {
          window.location.reload();
        },
      },
      { id: 'sep1', label: '', onSelect: () => {}, separatorAfter: true },
      {
        id: 'about',
        label: t('aboutMoonless'),
        icon: <Info size={14} />,
        onSelect: () => window.open('https://github.com/JacksonHe04/moon-escape', '_blank'),
      },
    ],
    [t],
  );

  const saveStatusLabel = useMemo(() => {
    switch (autoSave.status) {
      case 'saving':
        return t('saving');
      case 'saved':
        return `${t('saved')} ${autoSave.lastSavedAt?.toLocaleTimeString(locale === 'zh' ? 'zh-CN' : 'en-US') ?? ''}`;
      case 'error':
        return `${t('error')} ${autoSave.error ?? ''}`;
      case 'dirty':
        return t('unsaved');
      default:
        return '';
    }
  }, [autoSave, locale, t]);

  const workspaceName = dirHandle?.name ?? null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-appBg text-fg font-sans">
      {/* ─── 左栏 (占据全高) ────────────────────────────────── */}
      <Sidebar side="left" collapsed={leftSidebar.collapsed} onToggleCollapsed={leftSidebar.toggle}>
        <WorkspaceSwitcher
          name={workspaceName}
          status={status}
          onPick={pickDirectory}
          onReauthorize={reauthorize}
        />
        <div className="flex-1 min-h-0 overflow-y-auto">
          <FileTree
            topEntries={topEntries}
            rootHandle={dirHandle}
            currentFilePath={currentFile?.path ?? null}
            onPickFile={handlePickFile}
            onRename={handleRenameEntry}
            onDelete={handleDeleteEntry}
            onCreateFile={fileTree.createNewFile}
            onCreateDir={fileTree.createNewDir}
            onCreateChild={fileTree.createChildDocument}
            emptyMessage={status === 'needs-reauth' ? '需要重新授权' : undefined}
          />
        </div>
        {dirHandle && (
          <div className="flex items-center justify-center gap-4 py-3 px-4 border-t border-borderSubtle bg-sidebarBg flex-shrink-0">
            <Tooltip label="新建文件" side="top">
              <IconButton
                icon={<FilePlus size={16} />}
                size="md"
                onClick={() => setCreatingFile(true)}
                aria-label="新建文件"
              />
            </Tooltip>
            <Tooltip label="新建文件夹" side="top">
              <IconButton
                icon={<FolderPlus size={16} />}
                size="md"
                onClick={() => setCreatingDir(true)}
                aria-label="新建文件夹"
              />
            </Tooltip>
          </div>
        )}
      </Sidebar>

      {/* ─── 右侧内容区 (包含顶栏、主区、右栏) ─────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        {/* ─── 顶栏 (在左栏右侧顶部) ────────────────────────────────── */}
        <header className="h-11 border-b border-borderSubtle px-4 flex items-center justify-between gap-3 bg-appBg flex-shrink-0 z-10 select-none">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {currentFile ? (
              <Breadcrumb
                segments={breadcrumbSegments}
                root={
                  <Tooltip label={workspaceName ?? '工作区'} side="bottom">
                    <FileText size={14} className="text-fgMuted" />
                  </Tooltip>
                }
              />
            ) : (
              <span className="text-[11px] font-sans text-fgMuted">{t('noFileSelected')}</span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Tooltip label={t('searchTooltip')} side="bottom">
              <IconButton
                icon={<Search size={15} />}
                size="sm"
                onClick={() => setSearchOpen(true)}
                aria-label={t('searchTooltip')}
              />
            </Tooltip>
            {search.building && (
              <span className="text-[11px] font-sans text-fgMuted">
                {t('searchProgress')} {search.progress.done}/{search.progress.total}
              </span>
            )}
            {saveStatusLabel && (
              <span
                className={`text-[11px] font-sans font-medium px-1.5 py-0.5 rounded ${
                  autoSave.status === 'saving'
                    ? 'text-warning bg-warning/10'
                    : autoSave.status === 'error'
                    ? 'text-danger bg-danger/10'
                    : 'text-fgMuted'
                }`}
              >
                {saveStatusLabel}
              </span>
            )}
            <button
              onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')}
              className="w-8 h-8 flex items-center justify-center text-xs font-mono font-bold hover:text-brandRed hover:bg-sidebarHoverBg transition-all rounded select-none cursor-pointer border border-borderSubtle"
              title={locale === 'zh' ? 'Switch to English' : '切换至中文'}
            >
              {locale.toUpperCase()}
            </button>
            <ThemeSwitcher />
            <Menu
              trigger={
                <IconButton
                  icon={<MoreHorizontal size={16} />}
                  size="sm"
                  aria-label={t('moreActions')}
                />
              }
              items={moreMenuItems}
              align="end"
            />
          </div>
        </header>

        {/* ─── 下方编辑/预览区域 (主区与右栏并排) ───────────────────────── */}
        <div className="flex-1 min-h-0 flex overflow-hidden relative">
          {/* ─── 主区 (编辑器) ────────────────────────────────── */}
          <main className="flex-1 min-w-0 flex flex-col bg-appBg overflow-hidden">
            {currentFile ? (
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                <div className="border-b border-borderSubtle bg-appBg px-10 pt-8 pb-5">
                  <input
                    value={documentTitle}
                    onChange={(e) => {
                      const title = e.target.value;
                      setFrontmatter((prev) => ({ ...prev, title }));
                      setFrontmatterDirty(true);
                      setDirty(true);
                    }}
                    className="w-full border-none bg-transparent p-0 text-[2rem] leading-tight font-semibold tracking-normal text-fg outline-none placeholder:text-fgMuted"
                    placeholder="Untitled"
                  />
                </div>
                <Editor
                  fileHandle={currentFile.handle}
                  filePath={currentFile.path}
                  onDirtyChange={setDirty}
                  onFrontmatterChange={(fm, fmText) => {
                    setFrontmatter(fm as Frontmatter);
                    // 首次加载时把原始 frontmatter 文本（保留引号/顺序/注释）记录下来。
                    // 后续如果用户改动了任何属性，frontmatterDirty 会被 PageProperties 标 true。
                    if (!frontmatterDirty) setOriginalFrontmatterText(fmText);
                  }}
                  onBodyChange={setBodyMd}
                  onEditorReady={setEditorInstance}
                />
              </div>
            ) : (
              <div className="flex-1 min-h-0 overflow-y-auto">
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
              </div>
            )}
          </main>

          {/* ─── 右栏 (辅助面板) ────────────────────────────────── */}
          {currentFile && (
            <Sidebar side="right" collapsed={rightSidebar.collapsed} onToggleCollapsed={rightSidebar.toggle}>
              <RightRail
                fileHandle={currentFile.handle}
                currentPath={currentFile.path}
                allFileTexts={allFileTexts}
                frontmatter={frontmatter}
                onFrontmatterChange={(fm) => {
                  setFrontmatter(fm);
                  // 用户在右侧属性面板修改了字段 → 标记 frontmatter 为 dirty，
                  // 下次保存时用 joinYAML 重新序列化（接受新的引号/顺序）。
                  setFrontmatterDirty(true);
                  setDirty(true);
                }}
                headings={headings}
                onJumpToHeading={(h) => {
                  // 使用锚点 ID 滚动到对应位置
                  if (editorInstance) {
                    const headingElement = editorInstance.view.dom.querySelector(`[id="${h.anchor}"]`);
                    if (headingElement) {
                      headingElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      // 更新 URL 锚点
                      window.history.replaceState(null, '', `#${h.anchor}`);
                    }
                  }
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
            </Sidebar>
          )}
        </div>
      </div>

      {/* ─── Modals ──────────────────────────────────────── */}
      {creatingFile && dirHandle && (
        <PromptDialog
          title={t('newFileRoot')}
          onConfirm={async (v) => {
            await fileTree.createNewFile(dirHandle, '', v);
            setCreatingFile(false);
          }}
          onCancel={() => setCreatingFile(false)}
        />
      )}
      {creatingDir && dirHandle && (
        <PromptDialog
          title={t('newFolderRoot')}
          onConfirm={async (v) => {
            await fileTree.createNewDir(dirHandle, '', v);
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
        <div className="fixed bottom-3 right-3 text-xs font-sans bg-danger/10 text-danger border border-danger/20 rounded px-3 py-1.5 shadow z-50 select-none">
          {errorMsg}
        </div>
      )}
    </div>
  );
}