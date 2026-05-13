import fs from "fs";
import path from "path";
import multer from "multer";

const uploadDirectory = path.join(process.cwd(), "uploads", "iic-applied");
fs.mkdirSync(uploadDirectory, { recursive: true });

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

  if (extension !== ".pdf") {
    callback(new Error("Invalid file type. Only PDF files are allowed."));
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

export const uploadIicApplied = upload.fields([{ name: "brochureFile", maxCount: 1 }]);
