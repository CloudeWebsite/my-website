"use client";

import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useId, type ReactNode } from "react";

/** Drag-to-reorder list (mouse, touch and keyboard: space to lift, arrows to move). */
export function SortableList<T extends { id: string }>({ items, onReorder, render, grid = false, className }: { items: T[]; onReorder: (next: T[]) => void; render: (item: T, handle: ReactNode) => ReactNode; grid?: boolean; className?: string }) {
  const dndId = useId();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const onEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = items.findIndex((i) => i.id === e.active.id);
    const to = items.findIndex((i) => i.id === e.over!.id);
    onReorder(arrayMove(items, from, to));
  };
  return (
    <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={grid ? rectSortingStrategy : verticalListSortingStrategy}>
        <ul className={className}>
          {items.map((item) => (
            <SortableRow key={item.id} id={item.id}>
              {(handle) => render(item, handle)}
            </SortableRow>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({ id, children }: { id: string; children: (handle: ReactNode) => ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const handle = (
    <button type="button" className="a-handle" aria-label="Drag to reorder" {...attributes} {...listeners}>
      ⋮⋮
    </button>
  );
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 5 : undefined, position: "relative", opacity: isDragging ? 0.85 : 1 }}>
      {children(handle)}
    </li>
  );
}
