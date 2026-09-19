import { NextFunction, Request, Response, Router } from "express";
import multer from "multer";
import { authMiddleware } from "../../common/middleware/auth.middleware";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { AppError } from "../../common/errors/AppError";
import * as uploadsController from "./uploads.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(new AppError(400, "Only PDF files are allowed"));
      return;
    }
    cb(null, true);
  },
});

function handleUploadErrors(err: unknown, _req: Request, _res: Response, next: NextFunction) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      next(new AppError(400, "PDF file exceeds the 20MB size limit"));
      return;
    }
    next(new AppError(400, err.message));
    return;
  }
  next(err);
}

const router = Router();

router.use(authMiddleware);

router.post("/pdf", upload.single("file"), handleUploadErrors, asyncHandler(uploadsController.uploadPdfHandler));

export default router;
