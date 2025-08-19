import React, { useState, useCallback, useMemo } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import type { Service, ViewMode } from '@/types';
import {
  Plus,
  ExternalLink,
  Edit,
  Trash2,
  Server,
  Database,
  Globe,
  Activity,
  Code,
  Monitor,
  Zap,
  Cloud,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VirtualizedServiceGridProps {
  services: Service[];
  mode: ViewMode;
  onAddService: () => void;
  onEditService: (service: Service) => void;
  onDeleteService: (id: string) => void;
  onServiceClick: (service: Service) => void;
  selectedIds?: Set<string>;
  onSelectService?: (id: string, selected: boolean) => void;
  batchMode?: boolean;
}

const iconMap = {
  server: Server,
  database: Database,
  globe: Globe,
  activity: Activity,
  code: Code,
  monitor: Monitor,
  zap: Zap,
  cloud: Cloud,
};

// 获取状态颜色
const getStatusColor = (status: Service['status']) => {
  switch (status) {
    case 'online':
      return 'bg-green-500';
    case 'offline':
      return 'bg-red-500';
    case 'warning':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-500';
  }
};

// 获取状态文本
const getStatusText = (status: Service['status']) => {
  switch (status) {
    case 'online':
      return '在线';
    case 'offline':
      return '离线';
    case 'warning':
      return '警告';
    default:
      return '未知';
  }
};

interface ServiceCardProps {
  service: Service;
  mode: ViewMode;
  onEdit: (service: Service) => void;
  onDelete: (id: string) => void;
  onClick: (service: Service) => void;
  selected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  batchMode?: boolean;
}

const ServiceCard = React.memo(({ 
  service, 
  mode, 
  onEdit, 
  onDelete, 
  onClick, 
  selected = false,
  onSelect,
  batchMode = false
}: ServiceCardProps) => {
  const IconComponent = iconMap[service.icon as keyof typeof iconMap] || Server;

  const handleCardClick = useCallback(() => {
    if (batchMode && onSelect) {
      onSelect(service.id, !selected);
    } else {
      onClick(service);
    }
  }, [batchMode, onSelect, onClick, service, selected]);

  const handleEditClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(service);
  }, [onEdit, service]);

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(service.id);
  }, [onDelete, service.id]);

  return (
    <Card
      className={cn(
        'group relative transition-all duration-200 hover:shadow-md cursor-pointer h-full',
        mode === 'view' && 'hover:scale-105',
        batchMode && selected && 'ring-2 ring-primary'
      )}
      onClick={handleCardClick}
    >
      {batchMode && (
        <div className="absolute top-2 left-2 z-10">
          <Checkbox 
            checked={selected}
            onCheckedChange={(checked) => onSelect?.(service.id, checked as boolean)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <CardContent className="p-4 h-full flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2 rounded-lg bg-muted flex-shrink-0">
              <IconComponent className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm truncate">{service.name}</h3>
              <p className="text-xs text-muted-foreground truncate">{service.url}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 flex-shrink-0">
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                getStatusColor(service.status)
              )}
              title={getStatusText(service.status)}
            />
            {mode === 'view' && (
              <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0">
          {service.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
              {service.description}
            </p>
          )}

          {service.tags && service.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {service.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0.5">
                  {tag}
                </Badge>
              ))}
              {service.tags.length > 3 && (
                <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                  +{service.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>

        {mode === 'edit' && !batchMode && (
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-7 text-xs"
              onClick={handleEditClick}
            >
              <Edit className="h-3 w-3 mr-1" />
              编辑
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-7 text-xs text-destructive hover:text-destructive"
              onClick={handleDeleteClick}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              删除
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

ServiceCard.displayName = 'ServiceCard';

// 计算网格布局参数
const useGridLayout = (containerWidth: number, containerHeight: number) => {
  return useMemo(() => {
    const minCardWidth = 280;
    const maxCardWidth = 350;
    const cardHeight = 180;
    const gap = 16;
    
    // 计算列数
    const availableWidth = containerWidth - gap;
    let columnCount = Math.floor(availableWidth / (minCardWidth + gap));
    columnCount = Math.max(1, columnCount);
    
    // 计算实际卡片宽度
    const cardWidth = Math.min(
      maxCardWidth,
      (availableWidth - (columnCount - 1) * gap) / columnCount
    );
    
    // 计算行数
    const rowCount = Math.ceil(containerHeight / (cardHeight + gap));
    
    return {
      columnCount,
      cardWidth,
      cardHeight,
      gap,
      rowCount,
    };
  }, [containerWidth, containerHeight]);
};

interface GridCellProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: {
    services: Service[];
    mode: ViewMode;
    onEdit: (service: Service) => void;
    onDelete: (id: string) => void;
    onClick: (service: Service) => void;
    selectedIds?: Set<string>;
    onSelect?: (id: string, selected: boolean) => void;
    batchMode?: boolean;
    columnCount: number;
    cardWidth: number;
    gap: number;
  };
}

const GridCell = React.memo(({ columnIndex, rowIndex, style, data }: GridCellProps) => {
  const {
    services,
    mode,
    onEdit,
    onDelete,
    onClick,
    selectedIds,
    onSelect,
    batchMode,
    columnCount,
    cardWidth,
    gap,
  } = data;

  const serviceIndex = rowIndex * columnCount + columnIndex;
  const service = services[serviceIndex];

  if (!service) {
    return null;
  }

  return (
    <div
      style={{
        ...style,
        left: (style.left as number) + gap / 2,
        top: (style.top as number) + gap / 2,
        width: cardWidth,
        height: (style.height as number) - gap,
      }}
    >
      <ServiceCard
        service={service}
        mode={mode}
        onEdit={onEdit}
        onDelete={onDelete}
        onClick={onClick}
        selected={selectedIds?.has(service.id)}
        onSelect={onSelect}
        batchMode={batchMode}
      />
    </div>
  );
});

GridCell.displayName = 'GridCell';

export function VirtualizedServiceGrid({
  services,
  mode,
  onAddService,
  onEditService,
  onDeleteService,
  onServiceClick,
  selectedIds,
  onSelectService,
  batchMode = false,
}: VirtualizedServiceGridProps) {
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const gridLayout = useGridLayout(containerSize.width, containerSize.height);

  const rowCount = Math.ceil(services.length / gridLayout.columnCount);

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const resizeObserver = new ResizeObserver((entries) => {
        const { width, height } = entries[0].contentRect;
        setContainerSize({ width, height });
      });
      resizeObserver.observe(node);

      // 初始尺寸
      const { width, height } = node.getBoundingClientRect();
      setContainerSize({ width, height });

      return () => resizeObserver.disconnect();
    }
  }, []);

  const itemData = useMemo(() => ({
    services,
    mode,
    onEdit: onEditService,
    onDelete: onDeleteService,
    onClick: onServiceClick,
    selectedIds,
    onSelect: onSelectService,
    batchMode,
    columnCount: gridLayout.columnCount,
    cardWidth: gridLayout.cardWidth,
    gap: gridLayout.gap,
  }), [
    services,
    mode,
    onEditService,
    onDeleteService,
    onServiceClick,
    selectedIds,
    onSelectService,
    batchMode,
    gridLayout.columnCount,
    gridLayout.cardWidth,
    gridLayout.gap,
  ]);

  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-6 rounded-full bg-muted mb-4">
          <Server className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">暂无服务</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          {mode === 'edit' 
            ? '点击下方按钮开始添加您的第一个服务'
            : '当前没有可显示的服务'}
        </p>
        {mode === 'edit' && (
          <Button onClick={onAddService} className="gap-2">
            <Plus className="h-4 w-4" />
            添加服务
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div 
        ref={containerRef}
        className="w-full"
        style={{ height: 'calc(100vh - 300px)', minHeight: '400px' }}
      >
        {containerSize.width > 0 && containerSize.height > 0 && (
          <Grid
            columnCount={gridLayout.columnCount}
            columnWidth={gridLayout.cardWidth + gridLayout.gap}
            height={containerSize.height}
            rowCount={rowCount}
            rowHeight={gridLayout.cardHeight + gridLayout.gap}
            width={containerSize.width}
            itemData={itemData}
            overscanRowCount={2}
            overscanColumnCount={1}
          >
            {GridCell}
          </Grid>
        )}
      </div>

      {mode === 'edit' && (
        <div className="flex justify-center">
          <Button onClick={onAddService} className="gap-2">
            <Plus className="h-4 w-4" />
            添加服务
          </Button>
        </div>
      )}
    </div>
  );
}