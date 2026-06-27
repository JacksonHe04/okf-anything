'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { loadDirHandle, saveDirHandle, clearDirHandle } from '@/lib/db';
import { readDirectoryEntries } from '@/lib/fs-access';
import type { FileEntry } from '@/types/document';

export type DirectoryStatus = 'idle' | 'ready' | 'needs-reauth' | 'denied' | 'unsupported';

export function useDirectory() {
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [reauthHandle, setReauthHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [topEntries, setTopEntries] = useState<FileEntry[] | null>(null);
  const [status, setStatus] = useState<DirectoryStatus>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const pickInFlightRef = useRef(false);

  const refreshEntries = useCallback(async () => {
    if (!dirHandle) return null;
    const entries = await readDirectoryEntries(dirHandle);
    setTopEntries(entries);
    return entries;
  }, [dirHandle]);

  // 浏览器支持检查
  useEffect(() => {
    if (typeof window !== 'undefined' && !('showDirectoryPicker' in window)) {
      setStatus('unsupported');
      setErrorMsg('请用 Chrome / Edge / Brave / Arc (Firefox / Safari 不支持)');
    }
  }, []);

  // 启动时恢复已保存的 handle
  useEffect(() => {
    void (async () => {
      try {
        const handle = await loadDirHandle();
        if (!handle) return;
        const perm = await handle.queryPermission({ mode: 'readwrite' });
        if (perm === 'granted') {
          setDirHandle(handle);
          setStatus('ready');
          setTopEntries(await readDirectoryEntries(handle));
        } else {
          setReauthHandle(handle);
          setStatus('needs-reauth');
        }
      } catch (err) {
        console.error('[useDirectory] 恢复目录失败:', err);
      }
    })();
  }, []);

  /**
   * 选择目录。
   *
   * 注意：
   * 1. 必须从 button.onClick 的同步调用链直接触发 showDirectoryPicker，
   *    不能有 setTimeout / 异步前置操作，否则浏览器拒绝（transient user activation）。
   * 2. **不要在 picker 之后调用 `handle.requestPermission({ mode: 'readwrite' })`** —
   *    picker 已经把这次 user activation 消费完了，requestPermission 必须靠新的
   *    user activation 才能弹出权限确认框；没有激活时它会静默返回 'prompt'，
   *    让后续流程永远卡住。picker 返回的 handle 默认就是 readwrite granted。
   * 3. queryPermission 是只读查询，可以保留作为防御性检查；如果它返回非 'granted'
   *    （罕见，例如 picker 本身被外部中断），就直接放弃并提示用户重试。
   */
  const pickDirectory = useCallback(async () => {
    if (pickInFlightRef.current) return;
    pickInFlightRef.current = true;
    setErrorMsg(null);
    try {
      // 1. 弹出系统文件夹选择器；用户在 OS 层确认后，handle 已经带 readwrite granted
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' });

      // 2. 防御性确认权限状态（queryPermission 不需要 user activation，是只读查询）
      const perm = await handle.queryPermission({ mode: 'readwrite' });
      if (perm !== 'granted') {
        setErrorMsg(
          '浏览器未授予读写权限（queryPermission=' +
            perm +
            '）。请刷新页面或在站点设置里允许文件编辑后重试。',
        );
        return;
      }

      // 3. 读取顶层条目
      const entries = await readDirectoryEntries(handle);

      // 4. 更新状态
      setDirHandle(handle);
      setReauthHandle(null);
      setStatus('ready');
      setTopEntries(entries);

      // 5. 持久化 handle
      await saveDirHandle(handle);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return; // 用户取消，忽略
      if (err instanceof Error && err.name === 'NotAllowedError' && err.message.includes('File picker already active')) {
        return;
      }
      console.error('[useDirectory] pickDirectory error:', err);
      setErrorMsg(`选择目录失败: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      pickInFlightRef.current = false;
    }
  }, []);

  /**
   * 对已有 handle 重新请求权限（needs-reauth 状态）。
   */
  const reauthorize = useCallback(async () => {
    if (!reauthHandle) return;
    console.log('[useDirectory] reauthorize called');
    setErrorMsg(null);
    try {
      const perm = await reauthHandle.requestPermission({ mode: 'readwrite' });
      if (perm === 'granted') {
        setDirHandle(reauthHandle);
        setReauthHandle(null);
        setStatus('ready');
        setTopEntries(await readDirectoryEntries(reauthHandle));
      } else {
        await clearDirHandle();
        setReauthHandle(null);
        setStatus('denied');
      }
    } catch (err) {
      console.error('[useDirectory] reauthorize error:', err);
      setErrorMsg(`重新授权失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [reauthHandle]);

  return {
    dirHandle,
    topEntries,
    status,
    errorMsg,
    pickDirectory,
    reauthorize,
    refreshEntries,
  };
}
