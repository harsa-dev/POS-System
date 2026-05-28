import { randomUUID } from "crypto";
import { mkdirSync } from "fs";
import { Router, type RequestHandler } from "express";
import multer from "multer";
import path from "path";
import { MANAGEMENT_ROLES } from "../lib/constants.js";
import { requireRole } from "../lib/auth.js";
import { logger } from "../lib/logger.js";

const router = Router();
const UPLOADS_DIR = path.resolve("data/uploads");
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Map<string, string>([
  ["image/jpeg", ".jpg"],
  ["image/jpg", ".jpg"],
  ["image/pjpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/x-png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
  ["image/avif", ".avif"],
]);
const ALLOWED_IMAGE_EXTENSIONS = new Set(ALLOWED_IMAGE_TYPES.values());

mkdirSync(UPLOADS_DIR, { recursive: true });

function getAllowedImageExtension(file: Express.Multer.File) {
  const mimeExtension = ALLOWED_IMAGE_TYPES.get(file.mimetype.toLowerCase());
  if (mimeExtension) return mimeExtension;

  const originalExtension = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_IMAGE_EXTENSIONS.has(originalExtension)) return originalExtension;

  return null;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const extension = getAllowedImageExtension(file) ?? ".jpg";
    cb(null, `${Date.now()}-${randomUUID()}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES,
  },
  fileFilter: (_req, file, cb) => {
    if (getAllowedImageExtension(file)) {
      cb(null, true);
      return;
    }

    cb(new Error("Only JPG, PNG, WebP, GIF, and AVIF images are allowed"));
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
  logger.info(
    {
      url: req.originalUrl,
      contentType: req.headers["content-type"],
      contentLength: req.headers["content-length"],
    },
    "Upload request received",
  );

  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ])(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      const message =
        error.code === "LIMIT_FILE_SIZE"
          ? "Image too large"
          : "Image upload failed";
      const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      logger.warn(
        {
          url: req.originalUrl,
          status,
          code: error.code,
          field: error.field,
          message,
        },
        "Upload rejected by multer",
      );
      res.status(status).json({ success: false, message });
      return;
    }

    const message = error instanceof Error ? error.message : "Image upload failed";
    logger.warn(
      {
        url: req.originalUrl,
        status: 400,
        message,
      },
      "Upload rejected by validation",
    );
    res.status(400).json({ success: false, message });
  });
};

router.post("/", requireUploadAccess, uploadSingleImage, (req, res) => {
  const files = req.files as
    | {
        image?: Express.Multer.File[];
        file?: Express.Multer.File[];
      }
    | undefined;
  const uploadedFile = files?.image?.[0] ?? files?.file?.[0];

  if (!uploadedFile) {
    logger.warn(
      {
        url: req.originalUrl,
        status: 400,
        fields: files ? Object.keys(files) : [],
      },
      "Upload request did not include an image file",
    );
    res.status(400).json({
      success: false,
      message: "No file uploaded",
    });
    return;
  }

  const imageUrl = `/api/media/${uploadedFile.filename}`;
  logger.info(
    {
      url: req.originalUrl,
      field: files?.image?.[0] ? "image" : "file",
      originalName: uploadedFile.originalname,
      mimetype: uploadedFile.mimetype,
      size: uploadedFile.size,
      imageUrl,
    },
    "Upload saved",
  );

  res.status(201).json({
    success: true,
    imageUrl,
    url: imageUrl,
    data: { imageUrl, url: imageUrl },
  });
});

export default router;
