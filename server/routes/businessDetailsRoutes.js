import { Router } from "express";
import {
  createBusinessDetails,
  deleteBusinessByAdmin,
  getApprovedBusinessFilterOptionsForAdmin,
  getApprovedBusinessesForAdmin,
  getBusinessById,
  getMyBusinessesForFaculty,
  getReviewQueueForAdmin,
  reviewBusinessByAdmin,
} from "../controllers/businessDetailsController.js";
import { uploadBusinessDetails } from "../middleware/uploadBusinessDetails.js";
import { authenticateToken, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/", authenticateToken, uploadBusinessDetails, createBusinessDetails);
router.get(
  "/admin/approved",
  authenticateToken,
  requireRole(["admin"]),
  getApprovedBusinessesForAdmin,
);
router.get(
  "/admin/approved/filter-options",
  authenticateToken,
  requireRole(["admin"]),
  getApprovedBusinessFilterOptionsForAdmin,
);
router.get("/faculty/mine", authenticateToken, requireRole(["faculty"]), getMyBusinessesForFaculty);
router.get(
  "/admin/review-queue",
  authenticateToken,
  requireRole(["admin"]),
  getReviewQueueForAdmin,
);
router.patch(
  "/admin/:businessId/review",
  authenticateToken,
  requireRole(["admin"]),
  reviewBusinessByAdmin,
);
router.delete(
  "/admin/:businessId",
  authenticateToken,
  requireRole(["admin"]),
  deleteBusinessByAdmin,
);
router.get("/:businessId", authenticateToken, requireRole(["admin", "faculty"]), getBusinessById);

export default router;
