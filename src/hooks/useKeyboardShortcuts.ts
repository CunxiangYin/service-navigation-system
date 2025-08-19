import { useEffect } from 'react';

interface ShortcutHandlers {
  onSearch?: () => void;
  onNewService?: () => void;
  onToggleEditMode?: () => void;
  onToggleDarkMode?: () => void;
  onImportExport?: () => void;
  onEscape?: () => void;
  onSelectAll?: () => void;
  onDelete?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // 忽略在输入框中的按键
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        // 只处理 Escape 键
        if (event.key === 'Escape') {
          handlers.onEscape?.();
        }
        return;
      }

      // Cmd/Ctrl + K: 快速搜索
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        handlers.onSearch?.();
      }

      // Cmd/Ctrl + N: 新建服务
      if ((event.metaKey || event.ctrlKey) && event.key === 'n') {
        event.preventDefault();
        handlers.onNewService?.();
      }

      // Cmd/Ctrl + E: 切换编辑模式
      if ((event.metaKey || event.ctrlKey) && event.key === 'e') {
        event.preventDefault();
        handlers.onToggleEditMode?.();
      }

      // Cmd/Ctrl + D: 切换深色模式
      if ((event.metaKey || event.ctrlKey) && event.key === 'd') {
        event.preventDefault();
        handlers.onToggleDarkMode?.();
      }

      // Cmd/Ctrl + I: 导入/导出
      if ((event.metaKey || event.ctrlKey) && event.key === 'i') {
        event.preventDefault();
        handlers.onImportExport?.();
      }

      // Cmd/Ctrl + A: 全选（批量模式）
      if ((event.metaKey || event.ctrlKey) && event.key === 'a') {
        event.preventDefault();
        handlers.onSelectAll?.();
      }

      // Delete/Backspace: 删除选中的服务
      if (event.key === 'Delete' || event.key === 'Backspace') {
        handlers.onDelete?.();
      }

      // Escape: 取消/关闭
      if (event.key === 'Escape') {
        handlers.onEscape?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers, enabled]);
}

// 快捷键帮助文本
export const shortcuts = [
  { keys: ['Ctrl', 'K'], description: '快速搜索' },
  { keys: ['Ctrl', 'N'], description: '新建服务' },
  { keys: ['Ctrl', 'E'], description: '切换编辑模式' },
  { keys: ['Ctrl', 'D'], description: '切换深色模式' },
  { keys: ['Ctrl', 'I'], description: '导入/导出' },
  { keys: ['Ctrl', 'A'], description: '全选（批量模式）' },
  { keys: ['Delete'], description: '删除选中' },
  { keys: ['Esc'], description: '取消/关闭' },
];