import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePersonaAvatar } from "@/lib/ai";
import { extractAvatarUrl } from "@/lib/avatar";
import { uploadAvatarFromSourceToR2 } from "@/lib/r2";

/**
 * Extract taxonomy IDs from a mixed payload.
 * Accepts both singular ...Id and array ...Ids fields used by the client.
 */
function collectTaxonomyIds(payload: Record<string, any>): string[] {
  const ids: string[] = [];

  // Singular keys observed in the client payload
  const singularKeys = [
    "ageGroupId",
    "universityId",
    "organizationId",
    "cultureId",
    "communityTypeId",
    "politicalId",
    "religionId",
    "accentId",
  ];

  // Array keys observed in the client payload
  const arrayKeys = [
    "cultureIds",
    "archetypeIds",
    "philosophyIds",
    "fillerPhraseIds",
    "metaphorIds",
    "debateHabitIds",
  ];

  for (const k of singularKeys) {
    const v = payload[k];
    if (typeof v === "string" && v.trim()) ids.push(v);
  }
  for (const k of arrayKeys) {
    const arr = payload[k];
    if (Array.isArray(arr)) {
      for (const v of arr) {
        if (typeof v === "string" && v.trim()) ids.push(v);
      }
    }
  }
  return Array.from(new Set(ids));
}

/**
 * Parse quirksText (UI string) into quirks (string[]).
 * Split on commas or newlines, trim, remove empties.
 */
function parseQuirksFromText(quirksText: unknown): string[] | undefined {
  if (typeof quirksText !== "string") return undefined;
  const parts = quirksText
    .split(/[,|\n]/g)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length ? parts : [];
}

/**
 * Remove fields that are not scalar Persona columns (and would break Prisma),
 * and map UI helper fields into proper columns.
 */
function sanitizePersonaScalarData(payload: Record<string, any>, isUpdate = false): Record<string, any> {
  const data: Record<string, any> = { ...payload };

  // Never allow id inside data
  delete data.id;

  // Remove UI helpers / transient flags
  delete data.generateAvatar;

  // quirksText -> quirks
  const quirks = parseQuirksFromText(data.quirksText);
  delete data.quirksText;
  if (quirks) {
    data.quirks = isUpdate ? { set: quirks } : quirks;
  }

  // Strip any ...Id / ...Ids helper keys (they feed the taxonomies join instead)
  for (const key of Object.keys(data)) {
    if (key.endsWith("Id") || key.endsWith("Ids")) {
      delete data[key];
    }
  }

  // Remove undefined to avoid Prisma complaints
  for (const key of Object.keys(data)) {
    if (data[key] === undefined) delete data[key];
  }

  return data;
}

/* ---------------------------------- GET ---------------------------------- */

export async function GET() {
  const personas = await prisma.persona.findMany({
    orderBy: { createdAt: "desc" },
    include: { taxonomies: { include: { taxonomy: true } } },
  });
  return NextResponse.json(personas);
}

/* ---------------------------------- POST --------------------------------- */

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, any>;

    const taxonomyIds = collectTaxonomyIds(body);
    const scalarData = sanitizePersonaScalarData(body, /* isUpdate */ false);

    // 1) Create persona with scalar columns only
    const created = await prisma.persona.create({ data: scalarData });

    // 2) Attach taxonomies via join table
    if (taxonomyIds.length) {
      await prisma.persona.update({
        where: { id: created.id },
        data: {
          taxonomies: {
            deleteMany: {}, // reset current set (new record, but keeps idempotence)
            createMany: {
              data: taxonomyIds.map((taxonomyId) => ({ taxonomyId })),
              skipDuplicates: true,
            },
          },
        },
      });
    }

    // 3) Try to generate avatar if missing, then upload to R2 and persist URL
    let persona = await prisma.persona.findUnique({
      where: { id: created.id },
      include: { taxonomies: { include: { taxonomy: true } } },
    });

    console.log("[AvatarGen] env:", {
      AVATAR_AI_ENABLED: process.env.AVATAR_AI_ENABLED,
      OPENAI: !!process.env.OPENAI_API_KEY,
    });
    console.log("[AvatarGen] post-reload avatarUrl:", persona?.avatarUrl);

    if (persona && !persona.avatarUrl) {
      console.log("[AvatarGen] starting for persona", persona.id, {
        name: persona.name,
        ageGroup: persona.ageGroup,
        genderIdentity: persona.genderIdentity,
      });

      let generated: unknown = null;
      try {
        generated = await generatePersonaAvatar(persona);
      } catch (e) {
        console.error("[AvatarGen] generatePersonaAvatar threw:", e);
      }

      const urlCandidate = extractAvatarUrl(generated as any);
      if (!urlCandidate) {
        console.error("[AvatarGen] extractAvatarUrl returned null");
      } else {
        try {
          // Fix: use .url from the returned object
          const r2Result = await uploadAvatarFromSourceToR2(persona.id, urlCandidate);

          // ✅ Update avatarUrl correctly
          if (r2Result?.url) {
            await prisma.persona.update({
              where: { id: persona.id },
              data: { avatarUrl: r2Result.url },
            });
            console.log("[AvatarGen] uploaded to R2:", r2Result.url);
          } else {
            console.warn("[AvatarGen] upload returned no URL object");
          }
        } catch (e) {
          console.error("[AvatarGen] R2 upload failed:", e);
        }

        // Re-read after potential update
        persona = await prisma.persona.findUnique({
          where: { id: created.id },
          include: { taxonomies: { include: { taxonomy: true } } },
        });
      }
    } else {
      console.log("[AvatarGen] skipping: avatarUrl already set or persona missing");
    }

    return NextResponse.json(persona, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/personas error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to create persona." },
      { status: 500 }
    );
  }
}