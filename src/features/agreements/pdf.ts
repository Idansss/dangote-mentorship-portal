import 'server-only';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { Language } from '@prisma/client';
import type { AgreementTemplate } from './content';

// Server-side PDF rendering of a signed agreement (CLAUDE.md §5: e-sign + PDF).
// pdf-lib is pure JS (no native deps), so it runs in the Node server runtime
// without a headless browser. The PDF is a faithful snapshot of the signed text.

const PAGE = { width: 595.28, height: 841.89 }; // A4 in points
const MARGIN = 56;
const CONTENT_WIDTH = PAGE.width - MARGIN * 2;

const LABELS: Record<Language, { commitments: string; signedBy: string; date: string; version: string }> = {
  [Language.EN]: { commitments: 'Our commitments', signedBy: 'Signed by', date: 'Date', version: 'Version' },
  [Language.FR]: { commitments: 'Nos engagements', signedBy: 'Signé par', date: 'Date', version: 'Version' },
};

interface Cursor {
  page: PDFPage;
  y: number;
}

function wrapLine(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export interface RenderAgreementInput {
  template: AgreementTemplate;
  signerName: string;
  counterpartName?: string | null;
  signedAt: Date;
  lang: Language;
}

export async function renderAgreementPdf(input: RenderAgreementInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const labels = LABELS[input.lang];

  const cursor: Cursor = { page: doc.addPage([PAGE.width, PAGE.height]), y: PAGE.height - MARGIN };

  function ensureSpace(needed: number) {
    if (cursor.y - needed < MARGIN) {
      cursor.page = doc.addPage([PAGE.width, PAGE.height]);
      cursor.y = PAGE.height - MARGIN;
    }
  }

  function drawParagraph(text: string, opts?: { font?: PDFFont; size?: number; gap?: number; indent?: number }) {
    const f = opts?.font ?? font;
    const size = opts?.size ?? 11;
    const lineHeight = size * 1.4;
    const indent = opts?.indent ?? 0;
    for (const line of wrapLine(text, f, size, CONTENT_WIDTH - indent)) {
      ensureSpace(lineHeight);
      cursor.page.drawText(line, {
        x: MARGIN + indent,
        y: cursor.y - size,
        size,
        font: f,
        color: rgb(0.1, 0.1, 0.12),
      });
      cursor.y -= lineHeight;
    }
    cursor.y -= opts?.gap ?? 6;
  }

  // Title
  drawParagraph(input.template.title, { font: bold, size: 20, gap: 4 });
  drawParagraph(`${labels.version}: ${input.template.version}`, { size: 9, gap: 14 });

  // Intro
  for (const para of input.template.intro) drawParagraph(para, { gap: 10 });

  // Commitments
  drawParagraph(labels.commitments, { font: bold, size: 13, gap: 8 });
  for (const item of input.template.commitments) {
    // Bullet glyph + hanging indent for wrapped lines.
    const startY = cursor.y;
    drawParagraph(item, { indent: 16, gap: 6 });
    ensureSpace(0);
    cursor.page.drawText('•', { x: MARGIN, y: startY - 11, size: 11, font: bold, color: rgb(0.1, 0.1, 0.12) });
  }

  // Signature block
  cursor.y -= 18;
  drawParagraph(input.template.consent, { font: bold, size: 11, gap: 16 });
  drawParagraph(`${labels.signedBy}: ${input.signerName}`, { size: 12, gap: 4 });
  if (input.counterpartName) {
    drawParagraph(`(${input.counterpartName})`, { size: 10, gap: 4 });
  }
  drawParagraph(`${labels.date}: ${input.signedAt.toISOString().slice(0, 10)}`, { size: 12, gap: 0 });

  return doc.save();
}
