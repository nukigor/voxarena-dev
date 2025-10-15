import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePersonaAvatar } from "@/lib/ai";
import { extractAvatarUrl } from "@/lib/avatar";
import { uploadAvatarFromSourceToR2 } from "@/lib/r2";

function collectTaxonomyIds(payload: Record<string, any>): string[] {
  const ids: string[] = [];
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

function parseQuirksFromText(quirksText: unknown): string[] | undefined {
  if (typeof quirksText !== "string") return undefined;
  const parts = quirksText
    .split(/[,|\n]/g)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length ? parts : [];
}

function sanitizePersonaScalarData(payload: Record<string, any>, isUpdate = true): Record<string, any> {
  const data: Record<string, any> = { ...payload };

  delete data.id;
  delete data.generateAvatar;

  // quirksText -> quirks
  const quirks = parseQuirksFromText(data.quirksText);
  delete data.quirksText;
  if (quirks) data.quirks = isUpdate ? { set: quirks } : quirks;

  for (const key of Object.keys(data)) {
    if (key.endsWith("Id") || key.endsWith("Ids")) delete data[key];
  }
  for (const key of Object.keys(data)) {
    if (data[key] === undefined) delete data[key];
  }

  return data;
}

/* ----------------------------------- GET ---------------------------------- */

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const persona = await prisma.persona.findUnique({
    where: { id: params.id },
    include: { taxonomies: { include: { taxonomy: true } } },
  });
  if (!persona) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(persona);
}

/* ----------------------------------- PUT ---------------------------------- */

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, any>;
    const taxonomyIds = collectTaxonomyIds(body);
    const scalarData = sanitizePersonaScalarData(body, /* isUpdate */ true);

    // 1) Update scalar fields
    await prisma.persona.update({
      where: { id: params.id },
      data: scalarData,
    });

    // 2) Overwrite taxonomy relations
    if (taxonomyIds.length) {
      await prisma.persona.update({
        where: { id: params.id },
        data: {
          taxonomies: {
            deleteMany: {},
            createMany: {
              data: taxonomyIds.map((taxonomyId) => ({ taxonomyId })),
              skipDuplicates: true,
            },
          },
        },
      });
    } else if (Object.keys(body).some((k) => k.endsWith("Id") || k.endsWith("Ids"))) {
      // explicit clear if UI sent the helper keys but empty
      await prisma.persona.update({
        where: { id: params.id },
        data: { taxonomies: { deleteMany: {} } },
      });
    }

    // 3) (Re)read persona for avatar generation + final response
    let persona = await prisma.persona.findUnique({
      where: { id: params.id },
      include: { taxonomies: { include: { taxonomy: true } } },
    });

    // 4) Generate avatar if still missing, upload to R2, persist URL
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
          const r2Url = await uploadAvatarFromSourceToR2(persona.id, urlCandidate);
          await prisma.persona.update({
            where: { id: persona.id },
            data: { avatarUrl: r2Url },
          });
          console.log("[AvatarGen] uploaded to R2:", r2Url);
        } catch (e) {
          console.error("[AvatarGen] R2 upload failed:", e);
        }

        // Re-read after potential update
        persona = await prisma.persona.findUnique({
          where: { id: params.id },
          include: { taxonomies: { include: { taxonomy: true } } },
        });
      }
    }

    return NextResponse.json(persona);
  } catch (err: any) {
    console.error("PUT /api/personas/[id] error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to update persona." },
      { status: 500 }
    );
  }
}

/* --------------------------------- DELETE --------------------------------- */

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.persona.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("DELETE /api/personas/[id] error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to delete persona." },
      { status: 500 }
    );
  }
}