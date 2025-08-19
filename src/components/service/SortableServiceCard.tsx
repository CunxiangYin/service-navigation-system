import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ServiceCard } from './ServiceCard';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Service, ViewMode } from '@/types';

interface SortableServiceCardProps {
  service: Service;
  mode: ViewMode;
  onEdit?: (service: Service) => void;
  onDelete?: (id: string) => void;
  onClick?: () => void;
  isDragging?: boolean;
}

export function SortableServiceCard({
  service,
  mode,
  onEdit,
  onDelete,
  onClick,
  isDragging,
}: SortableServiceCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSorting,
  } = useSortable({ id: service.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative",
        isDragging && "opacity-50",
        isSorting && "z-50"
      )}
    >
      {mode === 'edit' && (
        <div
          {...attributes}
          {...listeners}
          className="absolute -left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing z-10 p-1 rounded bg-background/80 backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <ServiceCard
        service={service}
        mode={mode}
        onEdit={onEdit}
        onDelete={onDelete}
        onClick={onClick}
      />
    </div>
  );
}