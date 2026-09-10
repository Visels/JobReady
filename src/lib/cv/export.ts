import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont } from "pdf-lib";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { cvBlocks, type CvBlock, type CvDraft } from "./contracts";

const FONT_DIRECTORY = path.join(process.cwd(), "public", "fonts", "cv");
const STYLE: Record<
  CvBlock["kind"],
  { size: number; bold: boolean; before: number; after: number }
> = {
  name: { size: 24, bold: true, before: 0, after: 4 },
  headline: { size: 12, bold: false, before: 0, after: 6 },
  contact: { size: 9, bold: false, before: 0, after: 3 },
  heading: { size: 11, bold: true, before: 10, after: 4 },
  entry: { size: 11, bold: true, before: 5, after: 3 },
  meta: { size: 9, bold: false, before: 0, after: 5 },
  body: { size: 10.5, bold: false, before: 0, after: 3 },
  bullet: { size: 10.5, bold: false, before: 0, after: 4 },
};

export function wrapCvText(
  text: string,
  font: PDFFont,
  size: number,
  width: number,
) {
  const lines: string[] = [];
  let current = "";
  for (const word of text.replace(/\s+/g, " ").trim().split(" ")) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= width) {
      current = candidate;
      continue;
    }
    if (current) {
      lines.push(current);
      current = "";
    }
    for (const character of word) {
      if (
        current &&
        font.widthOfTextAtSize(current + character, size) > width
      ) {
        lines.push(current);
        current = "";
      }
      current += character;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function exportCvPdf(draft: CvDraft) {
  const document = await PDFDocument.create();
  document.registerFontkit(fontkit);
  const [regularBytes, boldBytes] = await Promise.all([
    readFile(path.join(FONT_DIRECTORY, "NotoSans-Regular.ttf")),
    readFile(path.join(FONT_DIRECTORY, "NotoSans-Bold.ttf")),
  ]);
  const regular = await document.embedFont(regularBytes, { subset: true });
  const bold = await document.embedFont(boldBytes, { subset: true });
  const supported = new Set(regular.getCharacterSet());
  document.setTitle(draft.title.trim() || "CV");
  document.setAuthor(draft.personal.fullName);
  document.setLanguage("en-KE");
  const width = 612,
    height = 792,
    margin = 50;
  let page = document.addPage([width, height]);
  let y = height - margin;
  const nextPage = () => {
    page = document.addPage([width, height]);
    y = height - margin;
  };
  for (const block of cvBlocks(draft)) {
    const clean = block.text.replace(/\s+/g, " ");
    if (
      [...clean].some((character) => !supported.has(character.codePointAt(0)!))
    )
      throw new Error(
        "This CV contains characters the PDF font cannot display. Download DOCX or replace those characters and try again.",
      );
    const style = STYLE[block.kind];
    const font = style.bold ? bold : regular;
    const bullet = block.kind === "bullet";
    const lines = wrapCvText(
      clean,
      font,
      style.size,
      width - margin * 2 - (bullet ? 13 : 0),
    );
    const lineHeight = style.size * 1.35;
    const keepNext =
      block.kind === "heading"
        ? 48
        : block.kind === "entry"
          ? 32
          : block.kind === "meta"
            ? 16
            : 0;
    const required =
      style.before + Math.min(lines.length, 2) * lineHeight + keepNext;
    if (y - required < margin) nextPage();
    y -= style.before;
    for (let index = 0; index < lines.length; index++) {
      if (y - lineHeight < margin) nextPage();
      y -= lineHeight;
      if (bullet && index === 0)
        page.drawText("•", { x: margin, y, font: regular, size: style.size });
      page.drawText(lines[index], {
        x: margin + (bullet ? 13 : 0),
        y,
        font,
        size: style.size,
        color: rgb(0.1, 0.13, 0.16),
      });
    }
    y -= style.after;
  }
  const pages = document.getPages();
  pages.forEach((page, index) =>
    page.drawText(`${index + 1} / ${pages.length}`, {
      x: width - margin - 28,
      y: 25,
      font: regular,
      size: 8,
      color: rgb(0.4, 0.4, 0.4),
    }),
  );
  return document.save();
}

export async function exportCvDocx(draft: CvDraft) {
  const children = cvBlocks(draft).map((block) => {
    const style = STYLE[block.kind];
    return new Paragraph({
      heading:
        block.kind === "heading"
          ? HeadingLevel.HEADING_1
          : block.kind === "name"
            ? HeadingLevel.TITLE
            : undefined,
      keepNext: ["heading", "entry", "meta"].includes(block.kind),
      widowControl: true,
      spacing: {
        before: style.before * 20,
        after: style.after * 20,
        line: Math.round(style.size * 1.35 * 20),
      },
      bullet: block.kind === "bullet" ? { level: 0 } : undefined,
      children: [
        new TextRun({
          text: block.text,
          size: style.size * 2,
          bold: style.bold,
          font: "Noto Sans",
          color: "000000",
        }),
      ],
    });
  });
  return Packer.toBuffer(
    new Document({
      title: draft.title.trim() || "CV",
      creator: draft.personal.fullName,
      description: "Curriculum vitae",
      styles: {
        default: {
          document: { run: { font: "Noto Sans", size: 21, color: "000000" } },
        },
      },
      sections: [
        {
          properties: {
            page: {
              size: { width: 12240, height: 15840 },
              margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 },
            },
          },
          children,
        },
      ],
    }),
  );
}
