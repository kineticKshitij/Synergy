import { useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  callback: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const matchingShortcut = shortcuts.find(shortcut => {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrlKey === undefined || event.ctrlKey === shortcut.ctrlKey;
        const shiftMatches = shortcut.shiftKey === undefined || event.shiftKey === shortcut.shiftKey;
        const altMatches = shortcut.altKey === undefined || event.altKey === shortcut.altKey;
        
        return keyMatches && ctrlMatches && shiftMatches && altMatches;
      });

      if (matchingShortcut) {
        event.preventDefault();
        matchingShortcut.callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
}

// Helper to format shortcut display
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  if (shortcut.ctrlKey) parts.push('Ctrl');
  if (shortcut.shiftKey) parts.push('Shift');
  if (shortcut.altKey) parts.push('Alt');
  parts.push(shortcut.key.toUpperCase());
  return parts.join('+');
}
