import { Router } from "express";
import {
  createIdeaDetails,
  getApprovedIdeaFilterOptionsForAdmin,
  getApprovedIdeasForAdmin,
  getIdeaById,
  getMyIdeasForFaculty,
  getReviewQueueForAdmin,
  reviewIdeaByAdmin,
} from "../controllers/ideaDetailsController.js";
import { uploadIdeaDetails } from "../middleware/uploadIdeaDetails.js";
import { authenticateToken, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/", authenticateToken, uploadIdeaDetails, createIdeaDetails);
router.get(
  "/admin/approved",
  authenticateToken,
  requireRole(["admin"]),
  getApprovedIdeasForAdmin
);
router.get(
  "/admin/approved/filter-options",
  authenticateToken,
  requireRole(["admin"]),
  getApprovedIdeaFilterOptionsForAdmin
);
router.get("/faculty/mine", authenticateToken, requireRole(["faculty"]), getMyIdeasForFaculty);
router.get(
  "/admin/review-queue",
  authenticateToken,
  requireRole(["admin"]),
  getReviewQueueForAdmin
);
router.patch(
  "/admin/:ideaId/review",
  authenticateToken,
  requireRole(["admin"]),
  reviewIdeaByAdmin
);
router.get("/:ideaId", authenticateToken, requireRole(["admin", "faculty"]), getIdeaById);

export default router;
