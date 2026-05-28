import { randomUUID } from "crypto";
import { mkdirSync } from "fs";
import { Router, type RequestHandler } from "express";
import multer from "multer";
import path from "path";
import { MANAGEMENT_ROLES } from "../lib/constants.js";
import { requireRole } from "../lib/auth.js";

const router = Router();
const UPLOADS_DIR = path.resolve("data/uploads");
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Map<string, string>([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
]);

mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const extension = ALLOWED_IMAGE_TYPES.get(file.mimetype) ?? ".jpg";
    cb(null, `${Date.now()}-${randomUUID()}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      cb(null, true);
      return;
    }

    cb(new Error("Only JPG, PNG, WebP, and GIF images are allowed"));
  },
});

const requireUploadAccess: RequestHandler = async (req, res, next) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;
    next();
  } catch (error) {
    next(error);
  }
};

const uploadSingleImage: RequestHandler = (req, res, next) => {
  upload.single("image")(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      const message =
        error.code === "LIMIT_FILE_SIZE"
          ? "Image size must be under 2MB"
          : "Image upload failed";
      const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      res.status(status).json({ success: false, message });
      return;
    }

    const message = error instanceof Error ? error.message : "Image upload failed";
    res.status(400).json({ success: false, message });
  });
};

router.post("/", requireUploadAccess, uploadSingleImage, (req, res) => {
  if (!req.file) {
    res.status(400).json({
      success: false,
      message: "No file uploaded",
    });
    return;
  }

  const imageUrl = `/api/media/${req.file.filename}`;

  res.status(201).json({
    success: true,
    imageUrl,
    data: { imageUrl },
  });
});

export default router;
