import { Response } from "express";
import { z } from "zod";
import { prisma } from "../config/db";
import { AuthRequest } from "../middleware/auth";
import { getIO } from "../sockets";

async function assertMember(boardId: string, userId: string) {
  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId } },
  });
  return membership;
}

export async function createTask(req: AuthRequest, res: Response) {
  const schema = z.object({
    boardId: z.string().uuid(),
    columnId: z.string().uuid(),
    title: z.string().min(1),
    description: z.string().optional(),
    dueDate: z.string().datetime().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const membership = await assertMember(parsed.data.boardId, req.user!.userId);
  if (!membership) return res.status(403).json({ error: "You are not a member of this board" });

  const count = await prisma.task.count({ where: { columnId: parsed.data.columnId } });
  const task = await prisma.task.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
      columnId: parsed.data.columnId,
      order: count,
    },
  });

  await prisma.activity.create({
    data: { boardId: parsed.data.boardId, userId: req.user!.userId, message: `created task "${task.title}"` },
  });

  getIO().to(parsed.data.boardId).emit("task:created", { task });
  res.status(201).json({ task });
}

export async function moveTask(req: AuthRequest, res: Response) {
  const schema = z.object({
    boardId: z.string().uuid(),
    taskId: z.string().uuid(),
    toColumnId: z.string().uuid(),
    toOrder: z.number().int().min(0),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const membership = await assertMember(parsed.data.boardId, req.user!.userId);
  if (!membership) return res.status(403).json({ error: "You are not a member of this board" });

  const task = await prisma.task.update({
    where: { id: parsed.data.taskId },
    data: { columnId: parsed.data.toColumnId, order: parsed.data.toOrder },
  });

  getIO().to(parsed.data.boardId).emit("task:moved", { task });
  res.json({ task });
}

export async function updateTask(req: AuthRequest, res: Response) {
  const schema = z.object({
    boardId: z.string().uuid(),
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    assigneeId: z.string().uuid().nullable().optional(),
    dueDate: z.string().datetime().nullable().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const membership = await assertMember(parsed.data.boardId, req.user!.userId);
  if (!membership) return res.status(403).json({ error: "You are not a member of this board" });

  const { boardId, ...data } = parsed.data;
  const task = await prisma.task.update({
    where: { id: req.params.taskId },
    data: {
      ...data,
      dueDate: data.dueDate === undefined ? undefined : data.dueDate ? new Date(data.dueDate) : null,
    },
  });

  getIO().to(boardId).emit("task:updated", { task });
  res.json({ task });
}

export async function deleteTask(req: AuthRequest, res: Response) {
  const schema = z.object({ boardId: z.string().uuid() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const membership = await assertMember(parsed.data.boardId, req.user!.userId);
  if (!membership) return res.status(403).json({ error: "You are not a member of this board" });

  await prisma.task.delete({ where: { id: req.params.taskId } });
  getIO().to(parsed.data.boardId).emit("task:deleted", { taskId: req.params.taskId });
  res.status(204).send();
}
