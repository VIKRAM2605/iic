import { Router } from "express";
import {
  createIicApplied,
  getApprovedIicAppliedFilterOptionsForAdmin,
  getApprovedIicAppliedForAdmin,
  getIicAppliedById,
  getIicAppliedReviewQueueForAdmin,
  getMyIicAppliedForFaculty,
  reviewIicAppliedByAdmin,
} from "../controllers/iicAppliedController.js";
import { authenticateToken, requireRole } from "../middleware/authMiddleware.js";
import { uploadIicApplied } from "../middleware/uploadIicApplied.js";

const router = Router();

router.post("/", authenticateToken, uploadIicApplied, createIicApplied);
router.get(
  "/admin/approved",
  authenticateToken,
  requireRole(["admin"]),
  getApprovedIicAppliedForAdmin,
);
router.get(
  "/admin/approved/filter-options",
  authenticateToken,
  requireRole(["admin"]),
  getApprovedIicAppliedFilterOptionsForAdmin,
);
router.get(
  "/faculty/mine",
  authenticateToken,
  requireRole(["faculty"]),
  getMyIicAppliedForFaculty,
);
router.get(
  "/admin/review-queue",
  authenticateToken,
  requireRole(["admin"]),
  getIicAppliedReviewQueueForAdmin,
);
router.patch(
  "/admin/:appliedId/review",
  authenticateToken,
  requireRole(["admin"]),
  reviewIicAppliedByAdmin,
);
router.get(
  "/:appliedId",
  authenticateToken,
  requireRole(["admin", "faculty"]),
  getIicAppliedById,
);

export default router;
