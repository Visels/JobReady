import type { InterviewQuestionTurn } from "@/types/interview";

type ReportPdfSession = {
  id: string;
  visaType: string;
  destinationCountry: string;
  originCountry: string;
  difficulty: string;
  createdAt: Date;
};

type ReportPdfReport = {
  evidenceStatus: string;
  answeredQuestions: number;
  score: number;
  answerConsistency: number;
  homeTiesStrength: number;
  returnIntentClarity: number;
  financialClarity: number;
  studyPurpose: number;
  composureUnderPressure: number;
  summary: string;
  keyWeaknesses: string[];
  suggestions: string[];
};

export type ReportPdfInput = {
  session: ReportPdfSession;
  report: ReportPdfReport;
  questions: InterviewQuestionTurn[];
  purposeMetricLabel: string;
};

type PdfPage = {
  commands: string[];
};

const pageWidth = 612;
const pageHeight = 792;
const margin = 54;
const contentWidth = pageWidth - margin * 2;
const bottomMargin = 54;

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

function wrapText(value: string, maxWidth: number, fontSize: number) {
  const words = normalizeText(value).split(/\s+/).filter(Boolean);
  const maxChars = Math.max(18, Math.floor(maxWidth / (fontSize * 0.48)));
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

function color(value: [number, number, number]) {
  return value.map((part) => (part / 255).toFixed(3)).join(" ");
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

  addTitle(title: string, subtitle: string) {
    this.text(title, {
      x: margin,
      y: this.y,
      font: "F2",
      fontSize: 24,
      colorValue: [18, 24, 38],
    });
    this.y -= 30;
    this.wrappedText(subtitle, {
      fontSize: 10,
      colorValue: [87, 96, 113],
      leading: 14,
    });
    this.y -= 12;
    this.rule();
  }

  heading(value: string) {
    this.ensureSpace(42);
    this.y -= 8;
    this.text(value, {
      x: margin,
      y: this.y,
      font: "F2",
      fontSize: 15,
      colorValue: [18, 24, 38],
    });
    this.y -= 22;
  }

  paragraph(value: string) {
    this.wrappedText(value, {
      fontSize: 10,
      colorValue: [45, 55, 72],
      leading: 14,
    });
    this.y -= 8;
  }

  keyValue(label: string, value: string) {
    this.ensureSpace(18);
    this.text(`${label}:`, {
      x: margin,
      y: this.y,
      font: "F2",
      fontSize: 10,
      colorValue: [18, 24, 38],
    });
    this.text(value, {
      x: margin + 120,
      y: this.y,
      font: "F1",
      fontSize: 10,
      colorValue: [45, 55, 72],
    });
    this.y -= 16;
  }

  bullets(items: string[]) {
    for (const item of items) {
      const lines = wrapText(item, contentWidth - 16, 10);
      this.ensureSpace(lines.length * 14 + 8);
      this.text("-", {
        x: margin,
        y: this.y,
        font: "F2",
        fontSize: 10,
        colorValue: [18, 24, 38],
      });
      lines.forEach((line, index) => {
        this.text(line, {
          x: margin + 14,
          y: this.y - index * 14,
          font: "F1",
          fontSize: 10,
          colorValue: [45, 55, 72],
        });
      });
      this.y -= lines.length * 14 + 5;
    }
    this.y -= 4;
  }

  metrics(metrics: Array<{ label: string; value: number }>) {
    const columnWidth = (contentWidth - 18) / 2;
    const rowHeight = 44;

    for (let index = 0; index < metrics.length; index += 2) {
      this.ensureSpace(rowHeight + 8);
      const row = metrics.slice(index, index + 2);
      row.forEach((metric, column) => {
        const x = margin + column * (columnWidth + 18);
        const y = this.y - 28;
        this.rect(x, y, columnWidth, 32, [248, 250, 252]);
        this.text(metric.label, {
          x: x + 8,
          y: y + 19,
          font: "F2",
          fontSize: 9,
          colorValue: [18, 24, 38],
        });
        this.text(`${metric.value}%`, {
          x: x + columnWidth - 36,
          y: y + 19,
          font: "F2",
          fontSize: 9,
          colorValue: [87, 96, 113],
        });
        this.rect(x + 8, y + 8, columnWidth - 16, 4, [224, 229, 236]);
        this.rect(
          x + 8,
          y + 8,
          Math.max(2, ((columnWidth - 16) * metric.value) / 100),
          4,
          metric.value < 60
            ? [208, 75, 75]
            : metric.value < 80
              ? [210, 153, 61]
              : [55, 154, 112],
        );
      });
      this.y -= rowHeight;
    }
    this.y -= 4;
  }

  question(turn: InterviewQuestionTurn, index: number) {
    this.heading(`Question ${index + 1}`);
    this.paragraph(`Interviewer: ${turn.question}`);
    if (turn.user_answer) this.paragraph(`Your answer: ${turn.user_answer}`);
    if (turn.answer_summary) this.paragraph(`Feedback: ${turn.answer_summary}`);
    if (turn.improved_answer) {
      this.paragraph(`Improved answer: ${turn.improved_answer}`);
    }
  }

  private addPage() {
    this.pages.push({ commands: [] });
    this.y = pageHeight - margin;
    this.text("Jobready", {
      x: margin,
      y: 28,
      font: "F2",
      fontSize: 8,
      colorValue: [132, 142, 157],
    });
    this.text(`Page ${this.pages.length}`, {
      x: pageWidth - margin - 32,
      y: 28,
      font: "F1",
      fontSize: 8,
      colorValue: [132, 142, 157],
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
    const page = this.currentPage();
    page.commands.push(
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
      `q 0.859 0.882 0.918 RG 0.8 w ${margin} ${this.y} m ${pageWidth - margin} ${this.y} l S Q`,
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

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function buildReportPdf(input: ReportPdfInput) {
  const doc = new PdfDocument();
  const isScored = input.report.evidenceStatus === "complete";

  doc.addTitle(
    "Interview Practice Report",
    `${input.session.destinationCountry} - ${input.session.visaType}`,
  );
  doc.keyValue("Created", formatDate(input.session.createdAt));
  doc.keyValue("Origin country", input.session.originCountry);
  doc.keyValue("Difficulty", input.session.difficulty);
  doc.keyValue("Answered questions", String(input.report.answeredQuestions));
  doc.keyValue(
    "Readiness score",
    isScored ? `${input.report.score}/100` : "Not scored",
  );

  doc.heading("Summary");
  doc.paragraph(input.report.summary);

  if (isScored) {
    doc.heading("Readiness Metrics");
    doc.metrics([
      { label: "Answer consistency", value: input.report.answerConsistency },
      { label: "Home ties strength", value: input.report.homeTiesStrength },
      { label: "Return intent clarity", value: input.report.returnIntentClarity },
      { label: "Financial clarity", value: input.report.financialClarity },
      { label: input.purposeMetricLabel, value: input.report.studyPurpose },
      {
        label: "Composure under pressure",
        value: input.report.composureUnderPressure,
      },
    ]);
  }

  doc.heading("Key Weaknesses");
  doc.bullets(input.report.keyWeaknesses);

  doc.heading("Suggestions");
  doc.bullets(input.report.suggestions);

  if (input.questions.length > 0) {
    doc.heading("Question Review");
    input.questions.forEach((turn, index) => doc.question(turn, index));
  }

  return doc.build();
}
