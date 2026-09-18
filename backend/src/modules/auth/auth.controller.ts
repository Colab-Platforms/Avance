import { Request, Response } from "express";
import * as authService from "./auth.service";

export async function loginHandler(req: Request, res: Response) {
  const result = await authService.login(req.body);
  res.status(200).json(result);
}
