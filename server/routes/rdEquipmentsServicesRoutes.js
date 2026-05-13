import { Router } from "express";
import {
  createRdEquipmentsService,
  getApprovedRdEquipmentsServicesFilterOptionsForAdmin,
  getApprovedRdEquipmentsServicesForAdmin,
  getMyRdEquipmentsServicesForFaculty,
  getRdEquipmentsServiceById,
  getRdEquipmentsServicesReviewQueueForAdmin,
  reviewRdEquipmentsServiceByAdmin,
} from "../controllers/rdEquipmentsServicesController.js";
import { uploadRdEquipmentsServices } from "../middleware/uploadRdEquipmentsServices.js";
import { authenticateToken, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/", authenticateToken, uploadRdEquipmentsServices, createRdEquipmentsService);
router.get(
  "/admin/approved",
  authenticateToken,
  requireRole(["admin"]),
  getApprovedRdEquipmentsServicesForAdmin,
);
router.get(
  "/admin/approved/filter-options",
  authenticateToken,
  requireRole(["admin"]),
  getApprovedRdEquipmentsServicesFilterOptionsForAdmin,
);
router.get(
  "/faculty/mine",
  authenticateToken,
  requireRole(["faculty"]),
  getMyRdEquipmentsServicesForFaculty,
);
router.get(
  "/admin/review-queue",
  authenticateToken,
  requireRole(["admin"]),
  getRdEquipmentsServicesReviewQueueForAdmin,
);
router.patch(
  "/admin/:equipmentId/review",
  authenticateToken,
  requireRole(["admin"]),
  reviewRdEquipmentsServiceByAdmin,
);
router.get(
  "/:equipmentId",
  authenticateToken,
  requireRole(["admin", "faculty"]),
  getRdEquipmentsServiceById,
);

export default router;
