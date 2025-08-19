import { useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, X, CheckSquare, Square, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Service, Category } from '@/types';

interface BatchOperationsProps {
  services: Service[];
  categories: Category[];
  selectedIds: Set<string>;
  onSelectService: (id: string, selected: boolean) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBatchDelete: () => void;
  onBatchMove: (categoryId: string) => void;
  className?: string;
}

export function BatchOperations({
  services,
  categories,
  selectedIds,
  onSelectService: _onSelectService,
  onSelectAll,
  onClearSelection,
  onBatchDelete,
  onBatchMove,
  className,
}: BatchOperationsProps) {
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const selectedCount = selectedIds.size;
  const allSelected = services.length > 0 && selectedCount === services.length;

  const handleBatchMove = (categoryId: string) => {
    onBatchMove(categoryId);
    setShowMoveMenu(false);
  };

  const handleSelectAll = () => {
    if (allSelected) {
      onClearSelection();
    } else {
      onSelectAll();
    }
  };

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            className="gap-2"
          >
            {allSelected ? (
              <>
                <CheckSquare className="h-4 w-4" />
                取消全选
              </>
            ) : (
              <>
                <Square className="h-4 w-4" />
                全选
              </>
            )}
          </Button>
          
          {selectedCount > 0 && (
            <>
              <span className="text-sm text-muted-foreground">
                已选择 {selectedCount} 个服务
              </span>
              
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMoveMenu(!showMoveMenu)}
                    className="gap-2"
                  >
                    <FolderOpen className="h-4 w-4" />
                    移动到
                  </Button>
                  
                  {showMoveMenu && (
                    <div className="absolute top-full mt-2 left-0 z-50 w-48 bg-background border rounded-md shadow-lg">
                      <div className="p-1">
                        {categories.map((category) => (
                          <button
                            key={category.id}
                            onClick={() => handleBatchMove(category.id)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-sm transition-colors"
                          >
                            {category.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onBatchDelete}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  删除
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearSelection}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

export function SelectableServiceCard({
  service: _service,
  selected,
  onSelect,
  children,
}: {
  service: Service;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <div className="absolute top-2 left-2 z-10">
        <Checkbox
          checked={selected}
          onCheckedChange={onSelect}
          className="bg-background"
        />
      </div>
      {children}
    </div>
  );
}