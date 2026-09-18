import { prisma } from "../../database/prisma";
import { AppError } from "../../common/errors/AppError";
import { ensureTabExists } from "../tabs/tabs.service";
import { findOrCreateSection } from "../tabs/sections.service";
import { CreateDocumentInput, ListDocumentsQuery, UpdateDocumentInput } from "./documents.validation";

export async function listDocuments(query: ListDocumentsQuery) {
  return prisma.document.findMany({
    where: {
      tabId: query.tabId,
      sectionId: query.sectionId,
    },
    orderBy: { order: "asc" },
  });
}

async function nextOrder(tabId: string, sectionId: string | null) {
  // `sectionId: null` silently matches nothing on Prisma's Mongo connector; the relation form works.
  const result = await prisma.document.aggregate({
    where: sectionId === null ? { tabId, section: { is: null } } : { tabId, sectionId },
    _max: { order: true },
  });
  return (result._max.order ?? -1) + 1;
}

export async function createDocument(input: CreateDocumentInput) {
  await ensureTabExists(input.tabId);

  let sectionId: string | null = null;
  if (input.sectionHeading) {
    const section = await findOrCreateSection(input.tabId, input.sectionHeading);
    sectionId = section.id;
  }

  const order = input.order ?? (await nextOrder(input.tabId, sectionId));

  return prisma.document.create({
    data: {
      tabId: input.tabId,
      title: input.title,
      url: input.url,
      sectionId,
      order,
    },
  });
}

export async function updateDocument(id: string, input: UpdateDocumentInput) {
  const document = await prisma.document.findUnique({ where: { id } });

  if (!document) {
    throw new AppError(404, "Document not found");
  }

  const tabId = input.tabId ?? document.tabId;

  if (input.tabId) {
    await ensureTabExists(input.tabId);
  }

  let sectionId: string | null | undefined;
  if (input.sectionHeading === null) {
    sectionId = null;
  } else if (input.sectionHeading) {
    const section = await findOrCreateSection(tabId, input.sectionHeading);
    sectionId = section.id;
  }

  return prisma.document.update({
    where: { id },
    data: {
      tabId,
      title: input.title,
      url: input.url,
      order: input.order,
      ...(sectionId !== undefined ? { sectionId } : {}),
    },
  });
}

export async function deleteDocument(id: string) {
  const document = await prisma.document.findUnique({ where: { id } });

  if (!document) {
    throw new AppError(404, "Document not found");
  }

  await prisma.document.delete({ where: { id } });
}
