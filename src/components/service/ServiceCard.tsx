import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Service, ViewMode } from '@/types';
import { ExternalLink, Edit, Trash2, Globe, Server, Wrench, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { healthCheckService } from '@/services/healthCheck';

interface ServiceCardProps {
  service: Service;
  mode: ViewMode;
  onEdit?: (service: Service) => void;
  onDelete?: (id: string) => void;
  onClick?: () => void;
}

const statusConfig = {
  online: { label: '在线', variant: 'success' as const, icon: Globe },
  offline: { label: '离线', variant: 'destructive' as const, icon: Server },
  maintenance: { label: '维护中', variant: 'warning' as const, icon: Wrench },
  checking: { label: '检查中', variant: 'secondary' as const, icon: Loader2 },
  error: { label: '错误', variant: 'destructive' as const, icon: AlertCircle },
  warning: { label: '警告', variant: 'warning' as const, icon: AlertCircle },
};

export function ServiceCard({ service, mode, onEdit, onDelete, onClick }: ServiceCardProps) {
  const [localStatus, setLocalStatus] = useState(service.status || 'online');
  const [isChecking, setIsChecking] = useState(false);
  const StatusIcon = statusConfig[localStatus].icon;

  useEffect(() => {
    // Subscribe to health check updates
    const unsubscribe = healthCheckService.subscribe((status) => {
      if (status.serviceId === service.id) {
        setLocalStatus(status.status);
        setIsChecking(false);
      }
    });

    // Get current health status
    const currentStatus = healthCheckService.getStatus(service.id);
    if (currentStatus) {
      setLocalStatus(currentStatus.status);
    }

    return () => {
      unsubscribe();
    };
  }, [service.id]);

  const handleCardClick = () => {
    if (mode === 'view' && onClick) {
      onClick();
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(service);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(service.id);
    }
  };

  const handleOpenLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(service.url, '_blank');
  };

  const handleRefreshStatus = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsChecking(true);
    await healthCheckService.checkService(service.id, service.url);
  };

  return (
    <Card
      className={cn(
        "group relative transition-all duration-200",
        mode === 'view' && "hover:shadow-lg cursor-pointer hover:scale-[1.02]",
        mode === 'edit' && "hover:shadow-md"
      )}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold line-clamp-1">
              {service.name}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={statusConfig[localStatus].variant} className="text-xs">
                <StatusIcon className={cn("w-3 h-3 mr-1", isChecking && "animate-spin")} />
                {statusConfig[localStatus].label}
              </Badge>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={handleRefreshStatus}
                disabled={isChecking}
              >
                <RefreshCw className={cn("h-3 w-3", isChecking && "animate-spin")} />
              </Button>
              {service.tags && service.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {service.tags.slice(0, 2).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {service.tags.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{service.tags.length - 2}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
          {mode === 'view' && (
            <Button
              size="icon"
              variant="ghost"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleOpenLink}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {service.description || '暂无描述'}
        </p>
        <div className="flex items-center justify-between">
          <code className="text-xs bg-muted px-2 py-1 rounded font-mono truncate max-w-[70%]">
            {service.url}
          </code>
          {mode === 'edit' && (
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={handleEdit}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}