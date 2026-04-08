import fs from "fs";
import path from "path";
import multer from "multer";

const uploadDirectory = path.join(process.cwd(), "uploads", "idea-details");
fs.mkdirSync(uploadDirectory, { recursive: true });

const allowedExtensions = new Set([".jpg", ".jpeg", ".png"]);

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
    callback(new Error("Invalid file type. Only JPG/JPEG/PNG are allowed."));
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
  { name: "ipPatentDocument", maxCount: 1 },
  { name: "innovationGrantDocument", maxCount: 1 },
  { name: "latestAchievementDocument", maxCount: 1 },
  { name: "startupRegistrationDocument", maxCount: 1 },
  { name: "innovationPhotograph", maxCount: 1 },
]);
