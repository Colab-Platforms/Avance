import { prisma } from "../../database/prisma";
import { AppError } from "../../common/errors/AppError";
import { ensureTabExists } from "./tabs.service";
import { CreateSectionInput, UpdateSectionInput } from "./sections.validation";

export async function createSection(tabId: string, input: CreateSectionInput) {
  await ensureTabExists(tabId);

  const existing = await prisma.section.findUnique({
    where: { tabId_heading: { tabId, heading: input.heading } },
  });

  if (existing) {
    throw new AppError(409, "A section with this heading already exists in this tab");
  }

  return prisma.section.create({
    data: { tabId, heading: input.heading, order: input.order ?? 0 },
  });
}

export async function updateSection(id: string, input: UpdateSectionInput) {
  const section = await prisma.section.findUnique({ where: { id } });

  if (!section) {
    throw new AppError(404, "Section not found");
  }

  if (input.heading) {
    const existing = await prisma.section.findUnique({
      where: { tabId_heading: { tabId: section.tabId, heading: input.heading } },
    });
    if (existing && existing.id !== id) {
      throw new AppError(409, "A section with this heading already exists in this tab");
    }
  }

  return prisma.section.update({ where: { id }, data: input });
}

export async function deleteSection(id: string) {
  const section = await prisma.section.findUnique({
    where: { id },
    include: { _count: { select: { documents: true } } },
  });

  if (!section) {
    throw new AppError(404, "Section not found");
  }

  if (section._count.documents > 0) {
    throw new AppError(409, "Cannot delete a section that still has documents");
  }

  await prisma.section.delete({ where: { id } });
}

export async function findOrCreateSection(tabId: string, heading: string) {
  const trimmed = heading.trim();

  const existing = await prisma.section.findUnique({
    where: { tabId_heading: { tabId, heading: trimmed } },
  });

  if (existing) {
    return existing;
  }

  const maxOrderResult = await prisma.section.aggregate({
    where: { tabId },
    _max: { order: true },
  });

  return prisma.section.create({
    data: { tabId, heading: trimmed, order: (maxOrderResult._max.order ?? -1) + 1 },
  });
}
