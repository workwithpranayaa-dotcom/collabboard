import { useState } from "react";
import { Droppable } from "@hello-pangea/dnd";
import TaskCard, { TaskData } from "./TaskCard";

interface Props {
  columnId: string;
  title: string;
  tasks: TaskData[];
  onAddTask: (columnId: string, title: string) => void;
}

export default function BoardColumn({ columnId, title, tasks, onAddTask }: Props) {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddTask(columnId, newTitle.trim());
    setNewTitle("");
    setAdding(false);
  }

  return (
    <div className="flex-shrink-0 w-72 bg-gray-100 dark:bg-gray-900/60 rounded-xl p-3">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="font-semibold text-sm">{title}</h3>
        <span className="text-xs text-gray-400">{tasks.length}</span>
      </div>

      <Droppable droppableId={columnId}>
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="min-h-[40px]">
            {tasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {adding ? (
        <form onSubmit={submit} className="mt-1">
          <input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onBlur={() => !newTitle && setAdding(false)}
            placeholder="Task title..."
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full text-left text-sm text-gray-500 hover:text-brand-600 px-2 py-1.5"
        >
          + Add task
        </button>
      )}
    </div>
  );
}
