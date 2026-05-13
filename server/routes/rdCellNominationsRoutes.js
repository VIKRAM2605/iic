import { Router } from "express";
import {
  createRdCellNomination,
  getApprovedRdCellNominationFilterOptionsForAdmin,
  getApprovedRdCellNominationsForAdmin,
  getMyRdCellNominationsForFaculty,
  getRdCellNominationById,
  getRdCellNominationReviewQueueForAdmin,
  reviewRdCellNominationByAdmin,
} from "../controllers/rdCellNominationsController.js";
import { uploadRdCellNominations } from "../middleware/uploadRdCellNominations.js";
import { authenticateToken, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/", authenticateToken, uploadRdCellNominations, createRdCellNomination);
router.get(
  "/admin/approved",
  authenticateToken,
  requireRole(["admin"]),
  getApprovedRdCellNominationsForAdmin,
);
router.get(
  "/admin/approved/filter-options",
  authenticateToken,
  requireRole(["admin"]),
  getApprovedRdCellNominationFilterOptionsForAdmin,
);
router.get(
  "/faculty/mine",
  authenticateToken,
  requireRole(["faculty"]),
  getMyRdCellNominationsForFaculty,
);
router.get(
  "/admin/review-queue",
  authenticateToken,
  requireRole(["admin"]),
  getRdCellNominationReviewQueueForAdmin,
);
router.patch(
  "/admin/:nominationId/review",
  authenticateToken,
  requireRole(["admin"]),
  reviewRdCellNominationByAdmin,
);
router.get(
  "/:nominationId",
  authenticateToken,
  requireRole(["admin", "faculty"]),
  getRdCellNominationById,
);

export default router;
