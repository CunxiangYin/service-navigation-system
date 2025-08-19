import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableServiceCard } from './SortableServiceCard';
import { ServiceCard } from './ServiceCard';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Service, ViewMode } from '@/types';

interface DraggableServiceGridProps {
  services: Service[];
  mode: ViewMode;
  onAddService?: () => void;
  onEditService?: (service: Service) => void;
  onDeleteService?: (id: string) => void;
  onServiceClick?: (service: Service) => void;
  onReorder?: (services: Service[]) => void;
}

export function DraggableServiceGrid({
  services,
  mode,
  onAddService,
  onEditService,
  onDeleteService,
  onServiceClick,
  onReorder,
}: DraggableServiceGridProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = services.findIndex((s) => s.id === active.id);
      const newIndex = services.findIndex((s) => s.id === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newServices = arrayMove(services, oldIndex, newIndex);
        onReorder?.(newServices);
      }
    }

    setActiveId(null);
  };

  const activeService = services.find((s) => s.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={services.map(s => s.id)} strategy={rectSortingStrategy}>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {services.map((service) => (
            <SortableServiceCard
              key={service.id}
              service={service}
              mode={mode}
              onEdit={onEditService}
              onDelete={onDeleteService}
              onClick={() => onServiceClick?.(service)}
              isDragging={activeId === service.id}
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
      </SortableContext>
      <DragOverlay>
        {activeId && activeService ? (
          <div className="opacity-90">
            <ServiceCard
              service={activeService}
              mode={mode}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}