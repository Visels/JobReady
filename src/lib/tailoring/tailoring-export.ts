import { createHash } from "node:crypto";

export const DOCX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const PDF_MIME_TYPE = "application/pdf";

export type TailoredDocumentSection = {
  heading: string;
  lines: string[];
};

export type TailoredDocumentContent = {
  title: string;
  subtitle?: string;
  sections: TailoredDocumentSection[];
  language?: string;
};

type ZipEntry = {
  name: string;
  body: Uint8Array;
};

function bytes(value: string) {
  return new TextEncoder().encode(value);
}

function decodeUtf8(value: Uint8Array) {
  return new TextDecoder("utf-8", { fatal: false }).decode(value);
}

function concatBytes(parts: Uint8Array[]) {
  const total = parts.reduce((sum, part) => sum + part.byteLength, 0);
  const output = new Uint8Array(total);
  let offset = 0;

  for (const part of parts) {
    output.set(part, offset);
    offset += part.byteLength;
  }

  return output;
}

const crcTable = (() => {
  const table: number[] = [];
  for (let index = 0; index < 256; index += 1) {
    let crc = index;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
    table[index] = crc >>> 0;
  }
  return table;
})();

function crc32(body: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of body) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUInt16(target: Uint8Array, offset: number, value: number) {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
}

function writeUInt32(target: Uint8Array, offset: number, value: number) {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
  target[offset + 2] = (value >>> 16) & 0xff;
  target[offset + 3] = (value >>> 24) & 0xff;
}

function readUInt16(body: Uint8Array, offset: number) {
  return body[offset] | (body[offset + 1] << 8);
}

function readUInt32(body: Uint8Array, offset: number) {
  return (
    (body[offset] |
      (body[offset + 1] << 8) |
      (body[offset + 2] << 16) |
      (body[offset + 3] << 24)) >>>
    0
  );
}

function createZip(entries: ZipEntry[]) {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = bytes(entry.name);
    const checksum = crc32(entry.body);
    const local = new Uint8Array(30 + name.byteLength + entry.body.byteLength);

    writeUInt32(local, 0, 0x04034b50);
    writeUInt16(local, 4, 20);
    writeUInt16(local, 6, 0);
    writeUInt16(local, 8, 0);
    writeUInt16(local, 10, 0);
    writeUInt16(local, 12, 0);
    writeUInt32(local, 14, checksum);
    writeUInt32(local, 18, entry.body.byteLength);
    writeUInt32(local, 22, entry.body.byteLength);
    writeUInt16(local, 26, name.byteLength);
    writeUInt16(local, 28, 0);
    local.set(name, 30);
    local.set(entry.body, 30 + name.byteLength);
    localParts.push(local);

    const central = new Uint8Array(46 + name.byteLength);
    writeUInt32(central, 0, 0x02014b50);
    writeUInt16(central, 4, 20);
    writeUInt16(central, 6, 20);
    writeUInt16(central, 8, 0);
    writeUInt16(central, 10, 0);
    writeUInt16(central, 12, 0);
    writeUInt16(central, 14, 0);
    writeUInt32(central, 16, checksum);
    writeUInt32(central, 20, entry.body.byteLength);
    writeUInt32(central, 24, entry.body.byteLength);
    writeUInt16(central, 28, name.byteLength);
    writeUInt16(central, 30, 0);
    writeUInt16(central, 32, 0);
    writeUInt16(central, 34, 0);
    writeUInt16(central, 36, 0);
    writeUInt32(central, 38, 0);
    writeUInt32(central, 42, offset);
    central.set(name, 46);
    centralParts.push(central);

    offset += local.byteLength;
  }

  const centralDirectory = concatBytes(centralParts);
  const end = new Uint8Array(22);
  writeUInt32(end, 0, 0x06054b50);
  writeUInt16(end, 8, entries.length);
  writeUInt16(end, 10, entries.length);
  writeUInt32(end, 12, centralDirectory.byteLength);
  writeUInt32(end, 16, offset);

  return concatBytes([...localParts, centralDirectory, end]);
}

function extractStoredZipEntry(body: Uint8Array, name: string) {
  let offset = 0;

  while (offset + 30 < body.byteLength) {
    const signature = readUInt32(body, offset);
    if (signature === 0x02014b50 || signature === 0x06054b50) break;
    if (signature !== 0x04034b50) break;

    const compressionMethod = readUInt16(body, offset + 8);
    const compressedSize = readUInt32(body, offset + 18);
    const fileNameLength = readUInt16(body, offset + 26);
    const extraLength = readUInt16(body, offset + 28);
    const fileName = decodeUtf8(
      body.slice(offset + 30, offset + 30 + fileNameLength),
    );
    const dataStart = offset + 30 + fileNameLength + extraLength;
    const dataEnd = dataStart + compressedSize;

    if (fileName === name) {
      if (compressionMethod !== 0) {
        throw new Error("Generated DOCX entry uses unsupported compression.");
      }

      return body.slice(dataStart, dataEnd);
    }

    offset = dataEnd;
  }

  throw new Error(`Generated DOCX entry not found: ${name}`);
}

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function xmlDecode(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function pdfEscape(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\r?\n/g, " ");
}

function pdfDecode(value: string) {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\");
}

function sanitizeLine(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function paragraphXml(value: string, style: "Title" | "Subtitle" | "Heading1" | "BodyText") {
  const styleXml =
    style === "BodyText" ? "" : `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>`;

  return `<w:p>${styleXml}<w:r><w:t>${xmlEscape(value)}</w:t></w:r></w:p>`;
}

function stylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/></w:style>
  <w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:qFormat/></w:style>
  <w:style w:type="paragraph" w:styleId="BodyText"><w:name w:val="Body Text"/></w:style>
</w:styles>`;
}

export function renderTailoredDocumentPlainText(input: TailoredDocumentContent) {
  const lines = [input.title];

  if (input.subtitle) {
    lines.push(input.subtitle);
  }

  for (const section of input.sections) {
    lines.push(section.heading);
    lines.push(...section.lines.map(sanitizeLine).filter(Boolean));
  }

  return normalizeExportedText(lines.join("\n"));
}

export function normalizeExportedText(value: string) {
  return value
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

export function sha256Hex(body: Uint8Array | string) {
  return createHash("sha256").update(body).digest("hex");
}

export function buildAccessibleDocx(input: TailoredDocumentContent) {
  const bodyXml = [
    paragraphXml(input.title, "Title"),
    ...(input.subtitle ? [paragraphXml(input.subtitle, "Subtitle")] : []),
    ...input.sections.flatMap((section) => [
      paragraphXml(section.heading, "Heading1"),
      ...section.lines
        .map(sanitizeLine)
        .filter(Boolean)
        .map((line) => paragraphXml(line, "BodyText")),
    ]),
    '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>',
  ].join("");
  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${bodyXml}</w:body>
</w:document>`;

  return createZip([
    {
      name: "[Content_Types].xml",
      body: bytes(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>',
      ),
    },
    {
      name: "_rels/.rels",
      body: bytes(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>',
      ),
    },
    {
      name: "word/_rels/document.xml.rels",
      body: bytes(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
      ),
    },
    {
      name: "word/document.xml",
      body: bytes(docXml),
    },
    {
      name: "word/styles.xml",
      body: bytes(stylesXml()),
    },
    {
      name: "docProps/core.xml",
      body: bytes(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${xmlEscape(input.title)}</dc:title><dc:language>${xmlEscape(input.language ?? "en-KE")}</dc:language></cp:coreProperties>`,
      ),
    },
    {
      name: "docProps/app.xml",
      body: bytes(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Jobready</Application></Properties>',
      ),
    },
  ]);
}

function extractDocxParagraphs(documentXml: string) {
  const paragraphs: string[] = [];
  const paragraphMatches = documentXml.match(/<w:p[\s\S]*?<\/w:p>/g) ?? [];

  for (const paragraph of paragraphMatches) {
    const text = [...paragraph.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)]
      .map((match) => xmlDecode(match[1]))
      .join("");

    if (sanitizeLine(text)) {
      paragraphs.push(sanitizeLine(text));
    }
  }

  return paragraphs;
}

export function extractTextFromGeneratedDocx(body: Uint8Array) {
  const documentXml = decodeUtf8(extractStoredZipEntry(body, "word/document.xml"));
  return normalizeExportedText(extractDocxParagraphs(documentXml).join("\n"));
}

function buildPdfObjects(input: TailoredDocumentContent) {
  const lines = renderTailoredDocumentPlainText(input).split("\n");
  const contentLines = lines
    .map((line, index) => {
      const tag = index === 0 ? "H1" : lines[index - 1] === input.title ? "P" : "P";
      return `/${tag} <</MCID ${index}>> BDC (${pdfEscape(line)}) Tj EMC T*`;
    })
    .join("\n");
  const stream = `BT /F1 11 Tf 72 760 Td 14 TL
${contentLines}
ET`;
  const escapedTitle = pdfEscape(input.title);

  return [
    `<< /Type /Catalog /Pages 2 0 R /Lang (${pdfEscape(input.language ?? "en-KE")}) /ViewerPreferences << /DisplayDocTitle true >> /MarkInfo << /Marked true >> /StructTreeRoot 7 0 R >>`,
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R /StructParents 0 >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${bytes(stream).byteLength} >>
stream
${stream}
endstream`,
    `<< /Title (${escapedTitle}) /Producer (Jobready deterministic exporter) >>`,
    "<< /Type /StructTreeRoot /K [] >>",
  ];
}

export function buildAccessiblePdf(input: TailoredDocumentContent) {
  const objects = buildPdfObjects(input);
  const parts: string[] = ["%PDF-1.7\n"];
  const offsets = [0];
  let byteOffset = bytes(parts[0]).byteLength;

  objects.forEach((object, index) => {
    offsets.push(byteOffset);
    const part = `${index + 1} 0 obj\n${object}\nendobj\n`;
    parts.push(part);
    byteOffset += bytes(part).byteLength;
  });

  const xrefOffset = byteOffset;
  const xrefRows = offsets
    .map((offset, index) =>
      index === 0
        ? "0000000000 65535 f "
        : `${offset.toString().padStart(10, "0")} 00000 n `,
    )
    .join("\n");
  parts.push(`xref
0 ${objects.length + 1}
${xrefRows}
trailer
<< /Size ${objects.length + 1} /Root 1 0 R /Info 6 0 R >>
startxref
${xrefOffset}
%%EOF`);

  return bytes(parts.join(""));
}

export function extractTextFromGeneratedPdf(body: Uint8Array) {
  const source = decodeUtf8(body);
  const text = [...source.matchAll(/\((?:\\.|[^\\)])*\)\s*Tj/g)]
    .map((match) => pdfDecode(match[0].slice(1, match[0].lastIndexOf(")"))))
    .join("\n");

  return normalizeExportedText(text);
}
