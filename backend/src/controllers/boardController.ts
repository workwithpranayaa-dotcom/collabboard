import { Response } from "express";
import { z } from "zod";
import { prisma } from "../config/db";
import { AuthRequest } from "../middleware/auth";

const DEFAULT_COLUMNS = ["To Do", "In Progress", "Done"];

export async function createBoard(req: AuthRequest, res: Response) {
  const schema = z.object({ title: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const userId = req.user!.userId;
  const board = await prisma.board.create({
    data: {
      title: parsed.data.title,
      ownerId: userId,
      members: { create: { userId, role: "ADMIN" } },
      columns: {
        create: DEFAULT_COLUMNS.map((title, order) => ({ title, order })),
      },
    },
    include: { columns: true, members: true },
  });

  res.status(201).json({ board });
}

export async function listBoards(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const boards = await prisma.board.findMany({
    where: { members: { some: { userId } } },
    include: { _count: { select: { columns: true, members: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json({ boards });
}

export async function getBoard(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const userId = req.user!.userId;

  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId: id, userId } },
  });
  if (!membership) return res.status(403).json({ error: "You are not a member of this board" });

  const board = await prisma.board.findUnique({
    where: { id },
    include: {
      columns: {
        orderBy: { order: "asc" },
        include: { tasks: { orderBy: { order: "asc" }, include: { assignee: { select: { id: true, name: true } } } } },
      },
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });
  if (!board) return res.status(404).json({ error: "Board not found" });
  res.json({ board });
}

export async function inviteMember(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const schema = z.object({ email: z.string().email(), role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER") });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const requester = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId: id, userId: req.user!.userId } },
  });
  if (!requester || requester.role !== "ADMIN") {
    return res.status(403).json({ error: "Only board admins can invite members" });
  }

  const invitee = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!invitee) return res.status(404).json({ error: "No user found with that email" });

  const member = await prisma.boardMember.upsert({
    where: { boardId_userId: { boardId: id, userId: invitee.id } },
    update: { role: parsed.data.role },
    create: { boardId: id, userId: invitee.id, role: parsed.data.role },
  });

  res.status(201).json({ member });
}
