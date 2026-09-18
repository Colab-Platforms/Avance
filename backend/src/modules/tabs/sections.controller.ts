import { Request, Response } from "express";
import * as sectionsService from "./sections.service";

export async function createSectionHandler(req: Request, res: Response) {
  const section = await sectionsService.createSection(req.params.id, req.body);
  res.status(201).json(section);
}

export async function updateSectionHandler(req: Request, res: Response) {
  const section = await sectionsService.updateSection(req.params.id, req.body);
  res.status(200).json(section);
}

export async function deleteSectionHandler(req: Request, res: Response) {
  await sectionsService.deleteSection(req.params.id);
  res.status(204).send();
}
