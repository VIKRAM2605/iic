import { Router } from "express";
import {
  createPrototypeDetails,
  getApprovedPrototypeFilterOptionsForAdmin,
  getApprovedPrototypesForAdmin,
  getPrototypeById,
  getMyPrototypesForFaculty,
  getReviewQueueForAdmin,
  reviewPrototypeByAdmin,
} from "../controllers/prototypeDetailsController.js";
import { uploadPrototypeDetails } from "../middleware/uploadPrototypeDetails.js";
import { authenticateToken, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/", authenticateToken, uploadPrototypeDetails, createPrototypeDetails);
router.get(
  "/admin/approved",
  authenticateToken,
  requireRole(["admin"]),
  getApprovedPrototypesForAdmin
);
router.get(
  "/admin/approved/filter-options",
  authenticateToken,
  requireRole(["admin"]),
  getApprovedPrototypeFilterOptionsForAdmin
);
router.get("/faculty/mine", authenticateToken, requireRole(["faculty"]), getMyPrototypesForFaculty);
router.get(
  "/admin/review-queue",
  authenticateToken,
  requireRole(["admin"]),
  getReviewQueueForAdmin
);
router.patch(
  "/admin/:prototypeId/review",
  authenticateToken,
  requireRole(["admin"]),
  reviewPrototypeByAdmin
);
router.get("/:prototypeId", authenticateToken, requireRole(["admin", "faculty"]), getPrototypeById);

export default router;
