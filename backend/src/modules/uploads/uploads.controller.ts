import { Request, Response } from "express";
import { AppError } from "../../common/errors/AppError";
import * as uploadsService from "./uploads.service";

export async function uploadPdfHandler(req: Request, res: Response) {
  if (!req.file) {
    throw new AppError(400, "No file uploaded");
  }

  const url = await uploadsService.uploadPdfBuffer(req.file.buffer, req.file.originalname);
  res.status(201).json({ url });
}
