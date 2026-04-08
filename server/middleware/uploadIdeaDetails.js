import fs from "fs";
import path from "path";
import multer from "multer";

const uploadDirectory = path.join(process.cwd(), "uploads", "idea-details");
fs.mkdirSync(uploadDirectory, { recursive: true });

const allowedExtensions = new Set([".pdf", ".jpg", ".jpeg", ".png"]);

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => {
    callback(null, uploadDirectory);
  },
  filename: (_request, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    callback(null, uniqueName);
  },
});

const fileFilter = (_request, file, callback) => {
  const extension = path.extname(file.originalname).toLowerCase();

  if (!allowedExtensions.has(extension)) {
    callback(new Error("Invalid file type. Only PDF/JPG/JPEG/PNG are allowed."));
    return;
  }

  callback(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

export const uploadIdeaDetails = upload.fields([
  { name: "feedbackDescription", maxCount: 1 },
  { name: "attendanceSheet", maxCount: 1 },
  { name: "photograph1", maxCount: 1 },
  { name: "photograph2", maxCount: 1 },
  { name: "overallReport", maxCount: 1 },
  { name: "offlineEventProof1", maxCount: 1 },
  { name: "offlineEventProof2", maxCount: 1 },
  { name: "onlineEventProof1", maxCount: 1 },
  { name: "onlineEventProof2", maxCount: 1 },
  { name: "sessionScheduleWithHeader", maxCount: 1 },
  { name: "sessionSchedule", maxCount: 1 },
  { name: "brochureWithLogo", maxCount: 1 },
  { name: "brochureProofName", maxCount: 1 },
  { name: "attendanceSheetWithHeader", maxCount: 1 },
  { name: "uploadedReport", maxCount: 1 },
]);
