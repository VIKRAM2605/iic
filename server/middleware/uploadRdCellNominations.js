import fs from "fs";
import path from "path";
import multer from "multer";

const uploadDirectory = path.join(process.cwd(), "uploads", "rd-cell-nominations");
fs.mkdirSync(uploadDirectory, { recursive: true });

const allowedExtensions = new Set([".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"]);

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
    callback(new Error("Invalid file type. Only PDF, DOC, DOCX, JPG, JPEG and PNG are allowed."));
    return;
  }

  callback(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export const uploadRdCellNominations = upload.fields([
  { name: "profileDocument", maxCount: 1 },
  { name: "proposalDocument", maxCount: 1 },
  { name: "supportingDocument", maxCount: 1 },
  { name: "approvalLetterDocument", maxCount: 1 },
]);
