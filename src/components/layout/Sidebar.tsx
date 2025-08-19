import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Category, ViewMode } from '@/types';
import { Plus, FolderOpen, Edit2, Trash2, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  categories: Category[];
  selectedCategory: string | null;
  onCategorySelect: (categoryId: string | null) => void;
  mode: ViewMode;
  onAddCategory?: () => void;
  onEditCategory?: (category: Category) => void;
  onDeleteCategory?: (categoryId: string) => void;
  className?: string;
}

export function Sidebar({
  categories,
  selectedCategory,
  onCategorySelect,
  mode,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  className,
}: SidebarProps) {
  return (
    <aside className={cn("w-64 border-r bg-background", className)}>
      <div className="flex flex-col h-full">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">分类</h2>
        </div>
        
        <ScrollArea className="flex-1 px-3 py-4">
          <div className="space-y-1">
            <Button
              variant={selectedCategory === null ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => onCategorySelect(null)}
            >
              <Home className="mr-2 h-4 w-4" />
              全部服务
              <Badge variant="secondary" className="ml-auto">
                {categories.reduce((sum, cat) => sum + (cat.count || 0), 0)}
              </Badge>
            </Button>

            {categories.map((category) => (
              <div key={category.id} className="group relative">
                <Button
                  variant={selectedCategory === category.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start pr-8"
                  onClick={() => onCategorySelect(category.id)}
                >
                  <FolderOpen className="mr-2 h-4 w-4" />
                  <span className="truncate flex-1 text-left">{category.name}</span>
                  {category.count !== undefined && (
                    <Badge variant="secondary" className="ml-auto">
                      {category.count}
                    </Badge>
                  )}
                </Button>
                
                {mode === 'edit' && (
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditCategory && onEditCategory(category);
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    {category.count === 0 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCategory && onDeleteCategory(category.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {mode === 'edit' && (
          <div className="p-3 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={onAddCategory}
            >
              <Plus className="mr-2 h-4 w-4" />
              添加分类
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}