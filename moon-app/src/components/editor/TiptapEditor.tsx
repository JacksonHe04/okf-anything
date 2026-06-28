'use client';

/**
 * TiptapEditor — 富文本编辑器
 * - 彻底修复了初始化加载时触发 auto-save 与丢失 YAML frontmatter/Body 内容的严重 Bug
 * - 支持 heading 元素的 id 属性（用于 TOC 跳转）
 */

import { useEffect, useRef } from 'react';
import { useEditor, EditorContent, type Editor as TiptapEditorType } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { slugify } from '@/lib/headings-extract';
import { splitYAML } from '@/lib/frontmatter';
import { mdToHtml, htmlToMd } from '@/lib/markdown-serde';

type TiptapEditorProps = {
  fileHandle: FileSystemFileHandle | null;
  filePath: string | null;
  onChange: (markdown: string) => void;
  onLoadFrontmatter?: (fm: Record<string, unknown>, fmText: string) => void;
  onLoadBody?: (body: string) => void;
  editorRef?: (editor: TiptapEditorType | null) => void;
};

export function TiptapEditor({ fileHandle, filePath, onChange, onLoadFrontmatter, onLoadBody, editorRef }: TiptapEditorProps) {
  // 用来标记是否正在载入/设置文件内容，避免初始化 setContent 时触发 onChange 并标记为 dirty
  const isSettingContent = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'tiptap-link' },
      }),
      Placeholder.configure({ placeholder: '开始写作…' }),
    ],
    content: '',
    immediatelyRender: false,
    onUpdate: ({ editor, transaction }) => {
      // 载入过程中不应触发 onChange，防止未修改内容却触发 auto-save
      if (isSettingContent.current || !transaction.docChanged || !editor.isFocused) return;
      onChange(htmlToMd(editor.getHTML()));
    },
    editorProps: {
      attributes: { class: 'tiptap-content' },
      handleClick(_view, _pos, event) {
        const target = event.target as HTMLElement | null;
        if (!target) return false;
        const link = target.closest('a[href]') as HTMLAnchorElement | null;
        if (!link) return false;
        if (!event.metaKey && !event.ctrlKey) return false;
        const href = link.getAttribute('href');
        if (!href || !href.endsWith('.md')) return false;
        event.preventDefault();
        window.dispatchEvent(new CustomEvent('double-link-click', { detail: { href } }));
        return true;
      },
    },
  });

  useEffect(() => {
    if (editorRef) editorRef(editor);
  }, [editor, editorRef]);

  useEffect(() => {
    if (!editor || !fileHandle) return;
    void (async () => {
      try {
        const file = await fileHandle.getFile();
        const text = await file.text();
        const { frontmatter: fm, body, frontmatterText: fmText } = splitYAML(text);
        const html = mdToHtml(body);

        isSettingContent.current = true;
        editor.commands.setContent(html, { parseOptions: { preserveWhitespace: 'full' } });
        onLoadFrontmatter?.(fm, fmText);
        onLoadBody?.(body); // 极其关键：在此同步载入父组件中的 bodyMd 状态，防止为空保存

        // 为所有 heading 添加 id 属性（用于 TOC 跳转）
        setTimeout(() => {
          const editorEl = editor.view.dom;
          const headings = editorEl.querySelectorAll('h1, h2, h3, h4, h5, h6');
          headings.forEach((heading) => {
            if (!heading.id) {
              heading.id = slugify(heading.textContent || '');
            }
          });
        }, 100);

        // 微任务或延时重置标记，确保 Tiptap 渲染事件处理完毕
        setTimeout(() => {
          isSettingContent.current = false;
        }, 200);
      } catch (err) {
        console.error('load file failed:', err);
        isSettingContent.current = false;
      }
    })();
  }, [editor, fileHandle, filePath]);

  if (!editor) return null;

  return (
    <div className="tiptap-wrapper">
      <EditorContent editor={editor} />
    </div>
  );
}
