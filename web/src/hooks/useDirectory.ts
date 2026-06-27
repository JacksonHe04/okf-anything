'use client';

import { useCallback, useEffect, useState } from 'react';
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

  // 浏览器支持检查
  useEffect(() => {
    if (typeof window !== 'undefined' && !('showDirectoryPicker' in window)) {
      setStatus('unsupported');
      setErrorMsg('请用 Chrome / Edge / Brave / Arc (Firefox / Safari 不支持)');
    }
  }, []);

  // 启动时恢复
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
        console.error('恢复目录失败:', err);
      }
    })();
  }, []);

  const pickDirectory = useCallback(async () => {
    setErrorMsg(null);
    try {
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      setDirHandle(handle);
      setReauthHandle(null);
      setStatus('ready');
      setTopEntries(await readDirectoryEntries(handle));
      await saveDirHandle(handle);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setErrorMsg(`选择目录失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, []);

  const reauthorize = useCallback(async () => {
    if (!reauthHandle) return;
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
  };
}
