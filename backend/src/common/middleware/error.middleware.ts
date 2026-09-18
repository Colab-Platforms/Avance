import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { env } from "../../config/env";

export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  console.error(err);
  const message = err instanceof Error ? err.message : "Internal server error";
  res.status(500).json({ error: env.nodeEnv === "development" ? message : "Internal server error" });
}
