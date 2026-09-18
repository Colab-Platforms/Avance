import { Request, Response } from "express";
import * as tabsService from "../tabs/tabs.service";

export async function getPublicTabsHandler(_req: Request, res: Response) {
  const catalog = await tabsService.getPublicCatalog();
  res.status(200).json(catalog);
}
