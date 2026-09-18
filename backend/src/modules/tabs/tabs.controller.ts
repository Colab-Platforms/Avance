import { Request, Response } from "express";
import * as tabsService from "./tabs.service";

export async function listTabsHandler(_req: Request, res: Response) {
  const tabs = await tabsService.listTabsForAdmin();
  res.status(200).json(tabs);
}

export async function createTabHandler(req: Request, res: Response) {
  const tab = await tabsService.createTab(req.body);
  res.status(201).json(tab);
}

export async function getTabHandler(req: Request, res: Response) {
  const tab = await tabsService.getTabDetail(req.params.id);
  res.status(200).json(tab);
}

export async function updateTabHandler(req: Request, res: Response) {
  const tab = await tabsService.updateTab(req.params.id, req.body);
  res.status(200).json(tab);
}

export async function deleteTabHandler(req: Request, res: Response) {
  await tabsService.deleteTab(req.params.id);
  res.status(204).send();
}
