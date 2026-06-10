import 'server-only';
import { ReviewType, RoleName } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { formSchemaShape, type FormSchemaShape } from './schema';

// Read helpers for the Forms Builder (CLAUDE.md §5 Reviews). The future review
// fill flow consumes `getActiveFormDefinition`; the admin screens consume the
// list/detail helpers.

export interface FormDefinitionSummary {
  id: string;
  type: ReviewType;
  roleName: RoleName | null;
  title: string;
  isActive: boolean;
  fieldCount: number;
  responseCount: number;
  updatedAt: Date;
}

/** Safely coerce the stored `schema` JSON into the canonical shape. */
export function parseFormSchema(schema: unknown): FormSchemaShape | null {
  const result = formSchemaShape.safeParse(schema);
  return result.success ? result.data : null;
}

export async function listFormDefinitions(cohortId: string): Promise<FormDefinitionSummary[]> {
  const definitions = await prisma.formDefinition.findMany({
    where: { cohortId, deletedAt: null },
    orderBy: [{ type: 'asc' }, { updatedAt: 'desc' }],
    include: { _count: { select: { responses: true } } },
  });

  return definitions.map((d) => ({
    id: d.id,
    type: d.type,
    roleName: d.roleName,
    title: d.title,
    isActive: d.isActive,
    fieldCount: parseFormSchema(d.schema)?.fields.length ?? 0,
    responseCount: d._count.responses,
    updatedAt: d.updatedAt,
  }));
}

export interface FormDefinitionDetail {
  id: string;
  cohortId: string;
  type: ReviewType;
  roleName: RoleName | null;
  title: string;
  isActive: boolean;
  schema: FormSchemaShape;
}

export async function getFormDefinition(id: string): Promise<FormDefinitionDetail | null> {
  const d = await prisma.formDefinition.findFirst({
    where: { id, deletedAt: null },
  });
  if (!d) return null;
  const schema = parseFormSchema(d.schema) ?? { fields: [] };
  return {
    id: d.id,
    cohortId: d.cohortId,
    type: d.type,
    roleName: d.roleName,
    title: d.title,
    isActive: d.isActive,
    schema,
  };
}

/**
 * The active form a respondent of `roleName` should fill for a review `type`.
 * Prefers a role-specific form, falling back to a role-agnostic one. Consumed by
 * the M3 review fill flow.
 */
export async function getActiveFormDefinition(
  cohortId: string,
  type: ReviewType,
  roleName: RoleName,
): Promise<FormDefinitionDetail | null> {
  const candidates = await prisma.formDefinition.findMany({
    where: {
      cohortId,
      type,
      isActive: true,
      deletedAt: null,
      // Role-specific OR the role-agnostic fallback (roleName null).
      OR: [{ roleName }, { roleName: null }],
    },
    orderBy: { updatedAt: 'desc' },
  });
  // Role-specific wins over the generic fallback.
  const chosen = candidates.find((c) => c.roleName === roleName) ?? candidates[0];
  if (!chosen) return null;
  return {
    id: chosen.id,
    cohortId: chosen.cohortId,
    type: chosen.type,
    roleName: chosen.roleName,
    title: chosen.title,
    isActive: chosen.isActive,
    schema: parseFormSchema(chosen.schema) ?? { fields: [] },
  };
}
