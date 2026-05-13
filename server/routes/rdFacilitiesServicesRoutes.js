import { Router } from "express";
import {
  createRdFacilitiesService,
  getApprovedRdFacilitiesServicesFilterOptionsForAdmin,
  getApprovedRdFacilitiesServicesForAdmin,
  getMyRdFacilitiesServicesForFaculty,
  getRdFacilitiesServiceById,
  getRdFacilitiesServicesReviewQueueForAdmin,
  reviewRdFacilitiesServiceByAdmin,
} from "../controllers/rdFacilitiesServicesController.js";
import { authenticateToken, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/", authenticateToken, createRdFacilitiesService);
router.get(
  "/admin/approved",
  authenticateToken,
  requireRole(["admin"]),
  getApprovedRdFacilitiesServicesForAdmin,
);
router.get(
  "/admin/approved/filter-options",
  authenticateToken,
  requireRole(["admin"]),
  getApprovedRdFacilitiesServicesFilterOptionsForAdmin,
);
router.get(
  "/faculty/mine",
  authenticateToken,
  requireRole(["faculty"]),
  getMyRdFacilitiesServicesForFaculty,
);
router.get(
  "/admin/review-queue",
  authenticateToken,
  requireRole(["admin"]),
  getRdFacilitiesServicesReviewQueueForAdmin,
);
router.patch(
  "/admin/:facilityId/review",
  authenticateToken,
  requireRole(["admin"]),
  reviewRdFacilitiesServiceByAdmin,
);
router.get(
  "/:facilityId",
  authenticateToken,
  requireRole(["admin", "faculty"]),
  getRdFacilitiesServiceById,
);

export default router;
