import { AgreementType } from '@prisma/client';

// Pure agreement-status derivation (unit-tested). Both agreements are required
// before a pair is considered "set up" — this feeds the journey tracker later.
export const REQUIRED_AGREEMENTS: AgreementType[] = [
  AgreementType.MENTORING,
  AgreementType.CONFIDENTIALITY,
];

export interface AgreementSummaryItem {
  type: AgreementType;
  signed: boolean;
}

export interface AgreementSummary {
  items: AgreementSummaryItem[];
  allSigned: boolean;
}

/** Given the agreement types a user has signed, summarize what remains. */
export function summarizeAgreements(signedTypes: AgreementType[]): AgreementSummary {
  const signed = new Set(signedTypes);
  const items = REQUIRED_AGREEMENTS.map((type) => ({ type, signed: signed.has(type) }));
  return { items, allSigned: items.every((i) => i.signed) };
}
