import { Router } from "express";
import {
  createRdCellActivity,
  getApprovedRdCellActivitiesForAdmin,
  getApprovedRdCellActivityFilterOptionsForAdmin,
  getMyRdCellActivitiesForFaculty,
  getRdCellActivityById,
  getRdCellActivityReviewQueueForAdmin,
  reviewRdCellActivityByAdmin,
} from "../controllers/rdCellActivitiesController.js";
import { uploadRdCellActivities } from "../middleware/uploadRdCellActivities.js";
import { authenticateToken, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/", authenticateToken, uploadRdCellActivities, createRdCellActivity);
router.get(
  "/admin/approved",
  authenticateToken,
  requireRole(["admin"]),
  getApprovedRdCellActivitiesForAdmin,
);
router.get(
  "/admin/approved/filter-options",
  authenticateToken,
  requireRole(["admin"]),
  getApprovedRdCellActivityFilterOptionsForAdmin,
);
router.get(
  "/faculty/mine",
  authenticateToken,
  requireRole(["faculty"]),
  getMyRdCellActivitiesForFaculty,
);
router.get(
  "/admin/review-queue",
  authenticateToken,
  requireRole(["admin"]),
  getRdCellActivityReviewQueueForAdmin,
);
router.patch(
  "/admin/:activityId/review",
  authenticateToken,
  requireRole(["admin"]),
  reviewRdCellActivityByAdmin,
);
router.get(
  "/:activityId",
  authenticateToken,
  requireRole(["admin", "faculty"]),
  getRdCellActivityById,
);

export default router;
