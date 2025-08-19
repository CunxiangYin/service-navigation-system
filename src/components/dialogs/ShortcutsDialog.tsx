import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { shortcuts } from '@/hooks/useKeyboardShortcuts';
import { Keyboard } from 'lucide-react';

interface ShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShortcutsDialog({ open, onOpenChange }: ShortcutsDialogProps) {
  const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            键盘快捷键
          </DialogTitle>
          <DialogDescription>
            使用这些快捷键可以更高效地操作
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-3 py-4">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
            >
              <span className="text-sm">{shortcut.description}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((key, keyIndex) => (
                  <React.Fragment key={keyIndex}>
                    {keyIndex > 0 && (
                      <span className="text-xs text-muted-foreground">+</span>
                    )}
                    <Badge variant="secondary" className="px-2 py-0.5">
                      <kbd className="text-xs">
                        {key === 'Ctrl' && isMac ? '⌘' : key}
                      </kbd>
                    </Badge>
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-xs text-muted-foreground text-center">
          按 <kbd className="px-1 py-0.5 bg-muted rounded">?</kbd> 随时查看快捷键帮助
        </div>
      </DialogContent>
    </Dialog>
  );
}