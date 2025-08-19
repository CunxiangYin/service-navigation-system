import { Button } from '@/components/ui/button';
import { Plus, FolderPlus, Server } from 'lucide-react';

interface EmptyStateProps {
  hasCategories: boolean;
  onAddCategory: () => void;
  onAddService: () => void;
  mode: 'view' | 'edit';
}

export function EmptyState({ hasCategories, onAddCategory, onAddService, mode }: EmptyStateProps) {
  if (!hasCategories) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
        <FolderPlus className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">欢迎使用服务导航系统</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          开始使用前，请先创建服务分类来组织您的服务
        </p>
        {mode === 'edit' ? (
          <Button onClick={onAddCategory} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            创建第一个分类
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            切换到编辑模式以创建分类
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
      <Server className="h-16 w-16 text-muted-foreground mb-4" />
      <h2 className="text-2xl font-semibold mb-2">服务导航系统已就绪</h2>
      <p className="text-muted-foreground mb-2 max-w-md">
        系统已配置默认分类，您可以开始添加服务了
      </p>
      <div className="text-sm text-muted-foreground mb-6 max-w-lg">
        <p className="mb-2">支持的服务类型示例：</p>
        <div className="flex flex-wrap gap-2 justify-center">
          <span className="px-2 py-1 bg-muted rounded-md">API服务</span>
          <span className="px-2 py-1 bg-muted rounded-md">数据库</span>
          <span className="px-2 py-1 bg-muted rounded-md">监控系统</span>
          <span className="px-2 py-1 bg-muted rounded-md">开发工具</span>
          <span className="px-2 py-1 bg-muted rounded-md">文档平台</span>
          <span className="px-2 py-1 bg-muted rounded-md">CI/CD</span>
        </div>
      </div>
      {mode === 'edit' ? (
        <div className="space-y-4">
          <Button onClick={onAddService} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            添加第一个服务
          </Button>
          <p className="text-xs text-muted-foreground">
            提示：可以添加 http://、https://、mysql:// 等各种协议的服务地址
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          切换到编辑模式以添加服务
        </p>
      )}
    </div>
  );
}