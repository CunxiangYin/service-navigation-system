import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ViewMode } from '@/types';
import { Search, Grid, Edit3, Menu, Moon, Sun, FileJson, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  onSearch: (query: string) => void;
  searchQuery: string;
  onMenuClick?: () => void;
  isDarkMode?: boolean;
  onThemeToggle?: () => void;
  onImportExport?: () => void;
  batchMode?: boolean;
  onBatchModeToggle?: () => void;
}

export function Header({
  mode,
  onModeChange,
  onSearch,
  searchQuery,
  onMenuClick,
  isDarkMode = false,
  onThemeToggle,
  onImportExport,
  batchMode = false,
  onBatchModeToggle,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center gap-4 px-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2">
          <Grid className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold hidden sm:block">服务导航</h1>
        </div>

        <div className="flex-1 flex items-center justify-center px-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="search"
              placeholder="搜索服务..."
              className="pl-10 w-full"
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 p-1 bg-muted rounded-lg">
            <Button
              variant={mode === 'view' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onModeChange('view')}
              className={cn("gap-2")}
            >
              <Grid className="h-4 w-4" />
              查看
            </Button>
            <Button
              variant={mode === 'edit' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onModeChange('edit')}
              className={cn("gap-2")}
            >
              <Edit3 className="h-4 w-4" />
              编辑
            </Button>
          </div>

          {mode === 'edit' && (
            <Button
              variant={batchMode ? "secondary" : "ghost"}
              size="icon"
              onClick={onBatchModeToggle}
              title="批量操作"
            >
              <CheckSquare className="h-5 w-5" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={onImportExport}
          >
            <FileJson className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onThemeToggle}
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}