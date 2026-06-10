import { describe, expect, it } from 'vitest';
import { AgreementType, Language } from '@prisma/client';
import { summarizeAgreements, REQUIRED_AGREEMENTS } from '@/features/agreements/status';
import { getAgreementTemplate } from '@/features/agreements/content';

describe('summarizeAgreements', () => {
  it('reports both required agreements unsigned for a fresh pair', () => {
    const summary = summarizeAgreements([]);
    expect(summary.allSigned).toBe(false);
    expect(summary.items.every((i) => !i.signed)).toBe(true);
    expect(summary.items.map((i) => i.type)).toEqual(REQUIRED_AGREEMENTS);
  });

  it('is not complete until both agreements are signed', () => {
    const partial = summarizeAgreements([AgreementType.MENTORING]);
    expect(partial.allSigned).toBe(false);
    expect(partial.items.find((i) => i.type === AgreementType.MENTORING)?.signed).toBe(true);
    expect(partial.items.find((i) => i.type === AgreementType.CONFIDENTIALITY)?.signed).toBe(false);
  });

  it('is complete once both are signed (order-independent)', () => {
    const full = summarizeAgreements([AgreementType.CONFIDENTIALITY, AgreementType.MENTORING]);
    expect(full.allSigned).toBe(true);
  });
});

describe('getAgreementTemplate', () => {
  it('provides complete EN and FR text for every agreement type', () => {
    for (const type of REQUIRED_AGREEMENTS) {
      for (const lang of [Language.EN, Language.FR]) {
        const tpl = getAgreementTemplate(type, lang);
        expect(tpl.title.length).toBeGreaterThan(0);
        expect(tpl.consent.length).toBeGreaterThan(0);
        expect(tpl.commitments.length).toBeGreaterThan(0);
        expect(tpl.version).toBeTruthy();
      }
    }
  });
});
