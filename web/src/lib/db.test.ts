import { describe, it, expect, beforeEach } from 'vitest';
import { openDB, saveDirHandle, loadDirHandle, clearDirHandle } from './db';

describe('IndexedDB dir handle persistence', () => {
  beforeEach(async () => {
    // 清空之前测试的写入
    await clearDirHandle();
  });

  it('loadDirHandle returns null when nothing saved', async () => {
    const handle = await loadDirHandle();
    expect(handle).toBeNull();
  });

  it('saveDirHandle then loadDirHandle returns the handle', async () => {
    const fakeHandle = { name: 'local' } as unknown as FileSystemDirectoryHandle;
    await saveDirHandle(fakeHandle);
    const loaded = await loadDirHandle();
    expect(loaded).toStrictEqual(fakeHandle);
  });

  it('clearDirHandle removes the saved handle', async () => {
    const fakeHandle = { name: 'local' } as unknown as FileSystemDirectoryHandle;
    await saveDirHandle(fakeHandle);
    await clearDirHandle();
    const loaded = await loadDirHandle();
    expect(loaded).toBeNull();
  });

  it('openDB returns a database', async () => {
    const db = await openDB();
    expect(db).toBeDefined();
    expect(db.name).toBe('leave-the-moon');
  });
});
