import { Request, Response } from "express";
import * as documentsService from "./documents.service";
import { ListDocumentsQuery } from "./documents.validation";

export async function listDocumentsHandler(req: Request, res: Response) {
  const documents = await documentsService.listDocuments(req.query as unknown as ListDocumentsQuery);
  res.status(200).json(documents);
}

export async function createDocumentHandler(req: Request, res: Response) {
  const document = await documentsService.createDocument(req.body);
  res.status(201).json(document);
}

export async function updateDocumentHandler(req: Request, res: Response) {
  const document = await documentsService.updateDocument(req.params.id, req.body);
  res.status(200).json(document);
}

export async function deleteDocumentHandler(req: Request, res: Response) {
  await documentsService.deleteDocument(req.params.id);
  res.status(204).send();
}
