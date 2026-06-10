import 'server-only';
import * as XLSX from 'xlsx';
import { ImportSourceType } from '@prisma/client';

// Parse an uploaded sheet into raw row objects (header → value). SheetJS
// handles .xlsx/.xls and .csv alike — Google Sheet/Form exports arrive as one
// of these. Imported data is untrusted (§14): values stay strings until the
// validation engine cleans them.

export interface ParsedSheet {
  sourceType: ImportSourceType;
  rows: Array<Record<string, unknown>>;
}

const EXCEL_EXTENSIONS = ['.xlsx', '.xls', '.xlsm'];

export function detectSourceType(fileName: string): ImportSourceType | null {
  const lower = fileName.toLowerCase();
  if (EXCEL_EXTENSIONS.some((ext) => lower.endsWith(ext))) return ImportSourceType.EXCEL;
  if (lower.endsWith('.csv')) return ImportSourceType.CSV;
  return null;
}

export function parseSheetBuffer(buffer: ArrayBuffer, fileName: string): ParsedSheet {
  const sourceType = detectSourceType(fileName);
  if (!sourceType) {
    throw new Error('Unsupported file type. Upload a .csv or .xlsx file.');
  }

  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return { sourceType, rows: [] };

  const sheet = workbook.Sheets[firstSheetName];
  if (!sheet) return { sourceType, rows: [] };

  // defval keeps empty cells as '' so headers stay aligned; raw:false yields
  // display strings, which the validator then parses deterministically.
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
    raw: false,
  });

  return { sourceType, rows };
}
