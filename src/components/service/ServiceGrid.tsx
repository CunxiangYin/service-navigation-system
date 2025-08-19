import React from 'react';
import { ServiceCard } from './ServiceCard';
import type { Service, ViewMode } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServiceGridProps {
  services: Service[];
  mode: ViewMode;
  onAddService?: () => void;
  onEditService?: (service: Service) => void;
  onDeleteService?: (id: string) => void;
  onServiceClick?: (service: Service) => void;
}

export function ServiceGrid({
  services,
  mode,
  onAddService,
  onEditService,
  onDeleteService,
  onServiceClick,
}: ServiceGridProps) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {services.map((service) => (
        <ServiceCard
          key={service.id}
          service={service}
          mode={mode}
          onEdit={onEditService}
          onDelete={onDeleteService}
          onClick={() => onServiceClick && onServiceClick(service)}
        />
      ))}
      {mode === 'edit' && (
        <Card
          className={cn(
            "group cursor-pointer border-dashed hover:border-primary hover:bg-accent/50 transition-all duration-200",
            "flex items-center justify-center min-h-[180px]"
          )}
          onClick={onAddService}
        >
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Plus className="h-12 w-12 text-muted-foreground group-hover:text-primary transition-colors" />
            <p className="mt-2 text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
              添加服务
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}