import { Router } from "express";
import { createEventDetails } from "../controllers/eventDetailsController.js";
import { uploadEventDetails } from "../middleware/uploadEventDetails.js";

const router = Router();

router.post("/", uploadEventDetails, createEventDetails);

export default router;
