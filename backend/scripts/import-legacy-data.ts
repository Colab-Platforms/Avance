import "dotenv/config";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface LegacyPdf {
  name: string;
  url: string;
}

interface LegacySection {
  heading: string | null;
  pdfs: LegacyPdf[];
}

interface LegacyTab {
  id: number;
  title: string;
  pdfs?: LegacyPdf[];
  sections?: LegacySection[];
}

async function main() {
  const dataPath = path.join(__dirname, "legacy-investor-data.json");
  const legacyTabs: LegacyTab[] = JSON.parse(fs.readFileSync(dataPath, "utf8"));

  for (let tabIndex = 0; tabIndex < legacyTabs.length; tabIndex++) {
    const legacyTab = legacyTabs[tabIndex];
    const title = legacyTab.title.trim();

    const tab = await prisma.tab.upsert({
      where: { title },
      update: { order: tabIndex },
      create: { title, order: tabIndex },
    });

    console.log(`Tab: ${title} (${tab.id})`);

    if (legacyTab.sections && legacyTab.sections.length > 0) {
      for (let sectionIndex = 0; sectionIndex < legacyTab.sections.length; sectionIndex++) {
        const legacySection = legacyTab.sections[sectionIndex];
        const heading = (legacySection.heading ?? title).trim();

        const section = await prisma.section.upsert({
          where: { tabId_heading: { tabId: tab.id, heading } },
          update: { order: sectionIndex },
          create: { tabId: tab.id, heading, order: sectionIndex },
        });

        for (let docIndex = 0; docIndex < legacySection.pdfs.length; docIndex++) {
          const pdf = legacySection.pdfs[docIndex];
          await prisma.document.create({
            data: {
              tabId: tab.id,
              sectionId: section.id,
              title: pdf.name,
              url: pdf.url,
              order: docIndex,
            },
          });
        }

        console.log(`  Section: ${heading} (${legacySection.pdfs.length} docs)`);
      }
    } else if (legacyTab.pdfs && legacyTab.pdfs.length > 0) {
      for (let docIndex = 0; docIndex < legacyTab.pdfs.length; docIndex++) {
        const pdf = legacyTab.pdfs[docIndex];
        await prisma.document.create({
          data: {
            tabId: tab.id,
            title: pdf.name,
            url: pdf.url,
            order: docIndex,
          },
        });
      }
      console.log(`  Flat docs: ${legacyTab.pdfs.length}`);
    }
  }

  console.log("Legacy import complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
