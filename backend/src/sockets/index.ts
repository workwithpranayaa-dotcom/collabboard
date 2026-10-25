import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import { verifyToken } from "../utils/jwt";

let io: Server;

export function initSocket(httpServer: HTTPServer) {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL || "http://localhost:3000" },
  });

  io.use((socket: Socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Missing auth token"));
      verifyToken(token);
      next();
    } catch {
      next(new Error("Invalid auth token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    socket.on("board:join", (boardId: string) => {
      socket.join(boardId);
    });

    socket.on("board:leave", (boardId: string) => {
      socket.leave(boardId);
    });

    socket.on("cursor:move", ({ boardId, x, y, name }: { boardId: string; x: number; y: number; name: string }) => {
      socket.to(boardId).emit("cursor:move", { x, y, name, socketId: socket.id });
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}
