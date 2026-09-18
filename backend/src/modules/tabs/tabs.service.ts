import { prisma } from "../../database/prisma";
import { AppError } from "../../common/errors/AppError";
import { CreateTabInput, UpdateTabInput } from "./tabs.validation";

export async function ensureTabExists(id: string) {
  const tab = await prisma.tab.findUnique({ where: { id } });
  if (!tab) {
    throw new AppError(404, "Tab not found");
  }
  return tab;
}

export async function listTabsForAdmin() {
  const tabs = await prisma.tab.findMany({
    orderBy: { order: "asc" },
    include: {
      _count: { select: { documents: true, sections: true } },
    },
  });

  return tabs.map((tab) => ({
    id: tab.id,
    title: tab.title,
    order: tab.order,
    documentCount: tab._count.documents,
    sectionCount: tab._count.sections,
  }));
}

export async function createTab(input: CreateTabInput) {
  const existing = await prisma.tab.findUnique({ where: { title: input.title } });
  if (existing) {
    throw new AppError(409, "A tab with this title already exists");
  }
  return prisma.tab.create({ data: { title: input.title, order: input.order ?? 0 } });
}

export async function getTabDetail(id: string) {
  const tab = await prisma.tab.findUnique({
    where: { id },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: { documents: { orderBy: { order: "asc" } } },
      },
      // `sectionId: null` silently matches nothing on Prisma's Mongo connector; the relation form works.
      documents: {
        where: { section: { is: null } },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!tab) {
    throw new AppError(404, "Tab not found");
  }

  return tab;
}

export async function updateTab(id: string, input: UpdateTabInput) {
  await ensureTabExists(id);

  if (input.title) {
    const existing = await prisma.tab.findUnique({ where: { title: input.title } });
    if (existing && existing.id !== id) {
      throw new AppError(409, "A tab with this title already exists");
    }
  }

  return prisma.tab.update({ where: { id }, data: input });
}

export async function deleteTab(id: string) {
  await ensureTabExists(id);

  await prisma.$transaction([
    prisma.document.deleteMany({ where: { tabId: id } }),
    prisma.section.deleteMany({ where: { tabId: id } }),
    prisma.tab.delete({ where: { id } }),
  ]);
}

export async function getPublicCatalog() {
  const tabs = await prisma.tab.findMany({
    orderBy: { order: "asc" },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: {
          documents: { orderBy: { order: "asc" } },
        },
      },
      documents: {
        where: { section: { is: null } },
        orderBy: { order: "asc" },
      },
    },
  });

  return tabs.map((tab) => {
    if (tab.sections.length > 0) {
      return {
        id: tab.id,
        title: tab.title,
        sections: tab.sections.map((section) => ({
          heading: section.heading,
          pdfs: section.documents.map((doc) => ({ title: doc.title, url: doc.url })),
        })),
      };
    }

    return {
      id: tab.id,
      title: tab.title,
      pdfs: tab.documents.map((doc) => ({ title: doc.title, url: doc.url })),
    };
  });
}
