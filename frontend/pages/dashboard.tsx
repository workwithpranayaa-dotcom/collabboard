import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { api, clearAuth, getStoredUser } from "../lib/api";

interface Board {
  id: string;
  title: string;
  createdAt: string;
  _count: { columns: number; members: number };
}

export default function Dashboard() {
  const router = useRouter();
  const [boards, setBoards] = useState<Board[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const user = getStoredUser();

  useEffect(() => {
    api
      .get("/api/boards")
      .then(({ data }) => setBoards(data.boards))
      .catch(() => router.push("/"))
      .finally(() => setLoading(false));
  }, [router]);

  async function createBoard(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const { data } = await api.post("/api/boards", { title });
    setBoards((prev) => [{ ...data.board, _count: { columns: 3, members: 1 } }, ...prev]);
    setTitle("");
  }

  function logout() {
    clearAuth();
    router.push("/");
  }

  return (
    <div className="min-h-screen px-6 py-8 max-w-5xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-brand-600">CollabBoard</h1>
          {user && <p className="text-sm text-gray-500">Welcome back, {user.name}</p>}
        </div>
        <button onClick={logout} className="text-sm text-gray-500 hover:text-red-600">
          Sign out
        </button>
      </header>

      <form onSubmit={createBoard} className="flex gap-2 mb-8">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New board name..."
          className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-4 py-2 font-medium">
          + New Board
        </button>
      </form>

      {loading ? (
        <p className="text-gray-500">Loading boards...</p>
      ) : boards.length === 0 ? (
        <p className="text-gray-500">No boards yet — create your first one above.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {boards.map((b) => (
            <button
              key={b.id}
              onClick={() => router.push(`/board/${b.id}`)}
              className="text-left bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:shadow-md hover:border-brand-500 transition"
            >
              <h3 className="font-semibold mb-1">{b.title}</h3>
              <p className="text-xs text-gray-500">
                {b._count.columns} columns · {b._count.members} member{b._count.members !== 1 ? "s" : ""}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
