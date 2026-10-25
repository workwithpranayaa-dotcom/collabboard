import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { api } from "../../lib/api";
import { getSocket } from "../../lib/socket";
import BoardColumn from "../../components/BoardColumn";
import { TaskData } from "../../components/TaskCard";

interface ColumnData {
  id: string;
  title: string;
  order: number;
  tasks: TaskData[];
}

interface Member {
  id: string;
  role: string;
  user: { id: string; name: string; email: string };
}

export default function BoardPage() {
  const router = useRouter();
  const { id } = router.query;
  const [title, setTitle] = useState("");
  const [columns, setColumns] = useState<ColumnData[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMsg, setInviteMsg] = useState("");

  const loadBoard = useCallback(async () => {
    if (!id) return;
    const { data } = await api.get(`/api/boards/${id}`);
    setTitle(data.board.title);
    setColumns(data.board.columns);
    setMembers(data.board.members);
  }, [id]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  // Live sync via Socket.io
  useEffect(() => {
    if (!id || typeof id !== "string") return;
    const socket = getSocket();
    socket.emit("board:join", id);

    socket.on("task:created", ({ task }: { task: TaskData & { columnId: string } }) => {
      setColumns((prev) =>
        prev.map((c) => (c.id === task.columnId ? { ...c, tasks: [...c.tasks, task] } : c))
      );
    });

    socket.on("task:moved", ({ task }: { task: TaskData & { columnId: string } }) => {
      loadBoard();
    });

    socket.on("task:deleted", ({ taskId }: { taskId: string }) => {
      setColumns((prev) => prev.map((c) => ({ ...c, tasks: c.tasks.filter((t) => t.id !== taskId) })));
    });

    return () => {
      socket.emit("board:leave", id);
      socket.off("task:created");
      socket.off("task:moved");
      socket.off("task:deleted");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleAddTask(columnId: string, taskTitle: string) {
    if (!id || typeof id !== "string") return;
    await api.post("/api/tasks", { boardId: id, columnId, title: taskTitle });
  }

  async function handleDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination || !id || typeof id !== "string") return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // Optimistic local update
    setColumns((prev) => {
      const next = prev.map((c) => ({ ...c, tasks: [...c.tasks] }));
      const sourceCol = next.find((c) => c.id === source.droppableId)!;
      const destCol = next.find((c) => c.id === destination.droppableId)!;
      const [moved] = sourceCol.tasks.splice(source.index, 1);
      destCol.tasks.splice(destination.index, 0, moved);
      return next;
    });

    await api.patch("/api/tasks/move", {
      boardId: id,
      taskId: draggableId,
      toColumnId: destination.droppableId,
      toOrder: destination.index,
    });
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!id || typeof id !== "string") return;
    try {
      await api.post(`/api/boards/${id}/invite`, { email: inviteEmail });
      setInviteMsg("Member added!");
      setInviteEmail("");
      loadBoard();
    } catch (err: any) {
      setInviteMsg(err?.response?.data?.error || "Could not invite that user");
    }
  }

  return (
    <div className="min-h-screen px-6 py-6">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-brand-600 text-sm">
            ← Boards
          </Link>
          <h1 className="text-xl font-bold">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {members.slice(0, 5).map((m) => (
              <div
                key={m.id}
                title={m.user.name}
                className="w-7 h-7 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center border-2 border-white dark:border-gray-950"
              >
                {m.user.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
          <form onSubmit={handleInvite} className="flex gap-1">
            <input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Invite by email"
              className="text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button type="submit" className="text-sm bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-3 py-1">
              Invite
            </button>
          </form>
        </div>
      </header>

      {inviteMsg && <p className="text-xs text-gray-500 mb-3">{inviteMsg}</p>}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns
            .sort((a, b) => a.order - b.order)
            .map((col) => (
              <BoardColumn key={col.id} columnId={col.id} title={col.title} tasks={col.tasks} onAddTask={handleAddTask} />
            ))}
        </div>
      </DragDropContext>
    </div>
  );
}
