import { Router } from "express";
import { createBoard, listBoards, getBoard, inviteMember } from "../controllers/boardController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);
router.post("/", createBoard);
router.get("/", listBoards);
router.get("/:id", getBoard);
router.post("/:id/invite", inviteMember);

export default router;
