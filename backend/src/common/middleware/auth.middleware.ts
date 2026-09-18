import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { verifyToken } from "../utils/jwt";

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    throw new AppError(401, "Missing or invalid Authorization header");
  }

  const token = header.slice("Bearer ".length);

  try {
    req.admin = verifyToken(token);
    next();
  } catch {
    throw new AppError(401, "Invalid or expired token");
  }
}
