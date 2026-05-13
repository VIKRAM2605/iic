import { Router } from "express";
import {
  createRdProjectsOutput,
  getApprovedRdProjectsOutputsFilterOptionsForAdmin,
  getApprovedRdProjectsOutputsForAdmin,
  getMyRdProjectsOutputsForFaculty,
  getRdProjectsOutputById,
  getRdProjectsOutputsReviewQueueForAdmin,
  reviewRdProjectsOutputByAdmin,
} from "../controllers/rdProjectsOutputsController.js";
import { uploadRdProjectsOutputs } from "../middleware/uploadRdProjectsOutputs.js";
import { authenticateToken, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/", authenticateToken, uploadRdProjectsOutputs, createRdProjectsOutput);
router.get(
  "/admin/approved",
  authenticateToken,
  requireRole(["admin"]),
  getApprovedRdProjectsOutputsForAdmin,
);
router.get(
  "/admin/approved/filter-options",
  authenticateToken,
  requireRole(["admin"]),
  getApprovedRdProjectsOutputsFilterOptionsForAdmin,
);
router.get(
  "/faculty/mine",
  authenticateToken,
  requireRole(["faculty"]),
  getMyRdProjectsOutputsForFaculty,
);
router.get(
  "/admin/review-queue",
  authenticateToken,
  requireRole(["admin"]),
  getRdProjectsOutputsReviewQueueForAdmin,
);
router.patch(
  "/admin/:projectId/review",
  authenticateToken,
  requireRole(["admin"]),
  reviewRdProjectsOutputByAdmin,
);
router.get(
  "/:projectId",
  authenticateToken,
  requireRole(["admin", "faculty"]),
  getRdProjectsOutputById,
);

export default router;
