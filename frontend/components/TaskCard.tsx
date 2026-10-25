import { Draggable } from "@hello-pangea/dnd";

export interface TaskData {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  assignee?: { id: string; name: string } | null;
}

export default function TaskCard({ task, index }: { task: TaskData; index: number }) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-3 mb-2 shadow-sm transition ${
            snapshot.isDragging ? "ring-2 ring-brand-500 rotate-1" : ""
          }`}
        >
          <p className="font-medium text-sm">{task.title}</p>
          {task.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
          )}
          <div className="flex items-center justify-between mt-2">
            {task.dueDate && (
              <span className="text-[11px] text-gray-400">
                {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
            {task.assignee && (
              <span className="text-[11px] bg-brand-50 dark:bg-brand-700/30 text-brand-600 dark:text-brand-300 rounded-full px-2 py-0.5">
                {task.assignee.name}
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
