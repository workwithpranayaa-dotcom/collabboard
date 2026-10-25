import { Router } from "express";
import { createTask, moveTask, updateTask, deleteTask } from "../controllers/taskController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);
router.post("/", createTask);
router.patch("/move", moveTask);
router.patch("/:taskId", updateTask);
router.delete("/:taskId", deleteTask);

export default router;
