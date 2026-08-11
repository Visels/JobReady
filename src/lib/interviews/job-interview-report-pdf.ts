import type {
  JobInterviewReportClaim,
  JobInterviewReportSnapshot,
  JobInterviewReportTurn,
} from "./job-interview-report-contracts";

type PdfPage = {
  commands: string[];
};

const pageWidth = 612;
const pageHeight = 792;
const margin = 52;
const contentWidth = pageWidth - margin * 2;
const bottomMargin = 58;

function normalizeText(value: unknown) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapePdfText(value: string) {
  return normalizeText(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function color(value: [number, number, number]) {
  return value.map((part) => (part / 255).toFixed(3)).join(" ");
}

function wrapText(value: string, maxWidth: number, fontSize: number) {
  const words = normalizeText(value).split(/\s+/).filter(Boolean);
  const maxChars = Math.max(16, Math.floor(maxWidth / (fontSize * 0.47)));
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length <= maxChars) {
      line = candidate;
      continue;
    }

    if (line) lines.push(line);
    if (word.length <= maxChars) {
      line = word;
      continue;
    }

    for (let index = 0; index < word.length; index += maxChars) {
      lines.push(word.slice(index, index + maxChars));
    }
    line = "";
  }

  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

class PdfDocument {
  private pages: PdfPage[] = [];
  private y = pageHeight - margin;

  constructor() {
    this.addPage();
  }

  build() {
    const pageObjects = this.pages.map((page, index) => ({
      pageObject: 3 + index * 2,
      contentObject: 4 + index * 2,
      content: page.commands.join("\n"),
    }));
    const objects = [
      "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
      `2 0 obj\n<< /Type /Pages /Kids [${pageObjects
        .map((page) => `${page.pageObject} 0 R`)
        .join(" ")}] /Count ${pageObjects.length} >>\nendobj\n`,
      ...pageObjects.flatMap((page) => {
        const pageObject = [
          `${page.pageObject} 0 obj`,
          "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]",
          "/Resources << /Font <<",
          "/F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
          "/F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
          ">> >>",
          `/Contents ${page.contentObject} 0 R >>`,
          "endobj\n",
        ].join("\n");
        const streamContent = `${page.content}\n`;
        const stream = `${page.contentObject} 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}endstream\nendobj\n`;
        return [pageObject, stream];
      }),
    ];

    let output = "%PDF-1.4\n";
    const offsets = [0];

    for (const object of objects) {
      offsets.push(output.length);
      output += object;
    }

    const xrefStart = output.length;
    output += `xref\n0 ${objects.length + 1}\n`;
    output += "0000000000 65535 f \n";
    for (const offset of offsets.slice(1)) {
      output += `${String(offset).padStart(10, "0")} 00000 n \n`;
    }
    output += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
    output += `startxref\n${xrefStart}\n%%EOF`;

    return Buffer.from(output, "ascii");
  }

  title(title: string, subtitle: string) {
    this.text(title, {
      x: margin,
      y: this.y,
      font: "F2",
      fontSize: 22,
      colorValue: [7, 21, 18],
    });
    this.y -= 28;
    this.wrappedText(subtitle, {
      fontSize: 10,
      colorValue: [82, 96, 91],
      leading: 14,
    });
    this.y -= 12;
    this.rule();
  }

  eyebrow(value: string) {
    this.ensureSpace(22);
    this.text(value.toUpperCase(), {
      x: margin,
      y: this.y,
      font: "F2",
      fontSize: 8,
      colorValue: [149, 102, 21],
    });
    this.y -= 17;
  }

  heading(value: string) {
    this.ensureSpace(42);
    this.y -= 4;
    this.text(value, {
      x: margin,
      y: this.y,
      font: "F2",
      fontSize: 14,
      colorValue: [7, 21, 18],
    });
    this.y -= 21;
  }

  paragraph(value: string) {
    this.wrappedText(value, {
      fontSize: 9.6,
      colorValue: [45, 55, 52],
      leading: 13.5,
    });
    this.y -= 8;
  }

  keyValue(label: string, value: string) {
    this.ensureSpace(17);
    this.text(`${label}:`, {
      x: margin,
      y: this.y,
      font: "F2",
      fontSize: 9.5,
      colorValue: [7, 21, 18],
    });
    this.text(value, {
      x: margin + 132,
      y: this.y,
      font: "F1",
      fontSize: 9.5,
      colorValue: [45, 55, 52],
    });
    this.y -= 15;
  }

  callout(title: string, body: string) {
    const bodyLines = wrapText(body, contentWidth - 24, 9.4);
    const height = Math.max(54, bodyLines.length * 13 + 32);
    this.ensureSpace(height + 8);
    const top = this.y;
    this.rect(margin, top - height + 10, contentWidth, height, [248, 239, 226]);
    this.text(title, {
      x: margin + 12,
      y: top - 10,
      font: "F2",
      fontSize: 10,
      colorValue: [7, 21, 18],
    });
    bodyLines.forEach((line, index) => {
      this.text(line, {
        x: margin + 12,
        y: top - 28 - index * 13,
        font: "F1",
        fontSize: 9.4,
        colorValue: [82, 96, 91],
      });
    });
    this.y -= height + 4;
  }

  bullets(items: string[]) {
    for (const item of items) {
      const lines = wrapText(item, contentWidth - 16, 9.5);
      this.ensureSpace(lines.length * 13 + 8);
      this.text("-", {
        x: margin,
        y: this.y,
        font: "F2",
        fontSize: 9.5,
        colorValue: [0, 83, 63],
      });
      lines.forEach((line, index) => {
        this.text(line, {
          x: margin + 14,
          y: this.y - index * 13,
          font: "F1",
          fontSize: 9.5,
          colorValue: [45, 55, 52],
        });
      });
      this.y -= lines.length * 13 + 5;
    }
    this.y -= 4;
  }

  claim(claim: JobInterviewReportClaim) {
    this.ensureSpace(70);
    this.text(claim.title, {
      x: margin,
      y: this.y,
      font: "F2",
      fontSize: 10.5,
      colorValue: [7, 21, 18],
    });
    this.y -= 15;
    this.paragraph(claim.detail);
    this.bullets(
      claim.evidence.map(
        (excerpt) => `Q${excerpt.sequence} evidence: "${excerpt.quote}"`,
      ),
    );
  }

  turn(turn: JobInterviewReportTurn) {
    this.heading(`Question ${turn.sequence} - ${turn.frameworkLabel}`);
    this.keyValue("Evidence status", formatLabel(turn.evidenceStatus));
    this.keyValue("Turn score", turn.overallScore === null ? "Not scored" : `${turn.overallScore}/100`);
    this.paragraph(`Question: ${turn.question}`);
    if (turn.answerExcerpt) {
      this.paragraph(`Candidate answer evidence: ${turn.answerExcerpt}`);
    }
    this.paragraph(`Evaluator summary: ${turn.answerSummary}`);

    if (turn.star.length > 0) {
      this.eyebrow("STAR evidence");
      this.bullets(
        turn.star.map(
          (part) =>
            `${part.label}: ${part.status}, score ${part.score ?? "not scored"}${
              part.evidence ? `, evidence "${part.evidence.quote}"` : ""
            }`,
        ),
      );
    }

    if (turn.criteria.length > 0) {
      this.eyebrow("Framework criteria");
      this.bullets(
        turn.criteria.map(
          (criterion) =>
            `${criterion.label}: ${criterion.score}/5. ${criterion.feedback}`,
        ),
      );
    }

    if (turn.improvedAnswer) {
      this.callout("Evidence-safe improved answer", turn.improvedAnswer);
    }
  }

  private addPage() {
    this.pages.push({ commands: [] });
    this.y = pageHeight - margin;
    this.text("Jiandae", {
      x: margin,
      y: 28,
      font: "F2",
      fontSize: 8,
      colorValue: [116, 128, 121],
    });
    this.text(`Page ${this.pages.length}`, {
      x: pageWidth - margin - 34,
      y: 28,
      font: "F1",
      fontSize: 8,
      colorValue: [116, 128, 121],
    });
  }

  private ensureSpace(height: number) {
    if (this.y - height >= bottomMargin) return;
    this.addPage();
  }

  private currentPage() {
    return this.pages[this.pages.length - 1];
  }

  private text(
    value: string,
    options: {
      x: number;
      y: number;
      font: "F1" | "F2";
      fontSize: number;
      colorValue: [number, number, number];
    },
  ) {
    this.currentPage().commands.push(
      [
        "BT",
        `/${options.font} ${options.fontSize} Tf`,
        `${color(options.colorValue)} rg`,
        `${options.x.toFixed(2)} ${options.y.toFixed(2)} Td`,
        `(${escapePdfText(value)}) Tj`,
        "ET",
      ].join(" "),
    );
  }

  private wrappedText(
    value: string,
    options: {
      fontSize: number;
      colorValue: [number, number, number];
      leading: number;
    },
  ) {
    const lines = wrapText(value, contentWidth, options.fontSize);
    this.ensureSpace(lines.length * options.leading + 8);
    lines.forEach((line, index) => {
      this.text(line, {
        x: margin,
        y: this.y - index * options.leading,
        font: "F1",
        fontSize: options.fontSize,
        colorValue: options.colorValue,
      });
    });
    this.y -= lines.length * options.leading;
  }

  private rule() {
    this.ensureSpace(18);
    this.currentPage().commands.push(
      `q 0.851 0.796 0.722 RG 0.8 w ${margin} ${this.y} m ${pageWidth - margin} ${this.y} l S Q`,
    );
    this.y -= 20;
  }

  private rect(
    x: number,
    y: number,
    width: number,
    height: number,
    fill: [number, number, number],
  ) {
    this.currentPage().commands.push(
      `q ${color(fill)} rg ${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re f Q`,
    );
  }
}

function formatLabel(value: string) {
  return value
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export function buildJobInterviewReportPdf(snapshot: JobInterviewReportSnapshot) {
  const doc = new PdfDocument();

  doc.title("Job Interview Report", snapshot.session.targetTitle);
  doc.keyValue("Evidence status", snapshot.evidence.label);
  doc.keyValue("Readiness score", snapshot.evidence.scoreLabel);
  doc.keyValue(
    "Answered questions",
    `${snapshot.evidence.answeredQuestions}/${snapshot.evidence.totalQuestions}`,
  );
  doc.keyValue("Evaluated questions", String(snapshot.evidence.evaluatedQuestions));
  doc.keyValue("Market", snapshot.session.market);
  doc.keyValue("Role", snapshot.session.role);
  doc.callout("Evidence status before score", snapshot.evidence.summary);

  doc.heading("Summary");
  doc.paragraph(snapshot.summary);

  doc.heading("Disclaimers");
  doc.bullets(snapshot.disclaimers);

  doc.heading("Strengths");
  if (snapshot.strengths.length > 0) {
    snapshot.strengths.forEach((claim) => doc.claim(claim));
  } else {
    doc.paragraph("No strength claim is shown without transcript evidence.");
  }

  doc.heading("Priority Improvements");
  if (snapshot.priorityImprovements.length > 0) {
    snapshot.priorityImprovements.forEach((claim) => doc.claim(claim));
  } else {
    doc.paragraph("No priority improvement is shown without transcript evidence.");
  }

  doc.heading("Next Practice Actions");
  if (snapshot.nextPracticeActions.length > 0) {
    snapshot.nextPracticeActions.forEach((claim) => doc.claim(claim));
  } else {
    doc.paragraph("Complete more transcript-backed practice before action claims are shown.");
  }

  if (snapshot.frameworkSections.length > 0) {
    doc.heading("Framework Sections");
    for (const section of snapshot.frameworkSections) {
      doc.eyebrow(section.label);
      doc.bullets(
        section.turns.map(
          (turn) =>
            `Question ${turn.sequence}: ${
              turn.score === null ? "not scored" : `${turn.score}/100`
            }, ${turn.star.length} STAR components, ${turn.criteria.length} framework criteria.`,
        ),
      );
    }
  }

  doc.heading("Turn Review");
  snapshot.turns.forEach((turn) => doc.turn(turn));

  return doc.build();
}
