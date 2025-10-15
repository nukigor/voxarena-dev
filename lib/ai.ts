// frontend/lib/ai.ts
// -----------------------------------------------------------------------------
// Centralized AI utilities for VoxArena: persona description and avatar image.
// - generatePersonaDescription(persona): returns { description }
// - buildAvatarPrompt(persona): builds a safe, bias-aware image prompt
// - generatePersonaAvatar(persona, size): returns data URL or null (feature-flagged)
//
// ENV:
//   OPENAI_API_KEY       - required for both description and avatar generation
//   AVATAR_AI_ENABLED=1  - enable avatar generation (off by default)
//
// NOTE: This file uses fetch() to call OpenAI endpoints to avoid SDK drift.
// -----------------------------------------------------------------------------

type TaxonomyLink = {
  taxonomyId: string;
  taxonomy?: {
    id: string;
    name: string;
    category: string | null;
  } | null;
};

type PersonaForAI = {
  id: string;
  name?: string | null;
  nickname?: string | null;

  // human-written fields we may or may not have
  description?: string | null;

  // communication / persona style
  temperament?: string | null;
  confidence?: number | null;
  verbosity?: number | null;
  tone?: string | null;
  vocabularyStyle?: string | null;
  conflictStyle?: string | null;
  debateApproach?: string[] | null;

  // work/life hints
  profession?: string | null;

  // identity presentation hints (we avoid inferring protected traits)
  genderIdentity?: string | null;
  pronouns?: string | null;

  // freeform notes
  accentNote?: string | null;

  // taxonomy join (pre-loaded with include)
  taxonomies?: TaxonomyLink[] | null;

  // convenience scalar kept in some flows
  ageGroup?: string | null;
};

/* -------------------------------- Utilities -------------------------------- */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

/** Minimal guard for environment. */
function assertApiKey(): string {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return OPENAI_API_KEY;
}

/** Normalize category name for comparisons. */
function normCat(s: string | null | undefined) {
  return (s || "").trim().toLowerCase();
}

/** Pull the first taxonomy term by category (case-insensitive). */
function getTaxonomyTerm(persona: PersonaForAI, category: string): string | null {
  const wanted = normCat(category);
  const list = persona?.taxonomies || [];
  for (const link of list) {
    const cat = normCat(link?.taxonomy?.category || null);
    if (cat === wanted) {
      return (link?.taxonomy?.name || "").trim() || null;
    }
  }
  return null;
}

/* ------------------------------- DESCRIPTION ------------------------------- */

/**
 * System prompt for persona descriptions.
 * The goal is stable, readable bios that the UI can show directly.
 */
function buildDescriptionSystemPrompt(): string {
  return [
    "You are a concise biographer for debate personas.",
    "Write a short, vivid profile (110–160 words) that sounds human and grounded.",
    "Do not state ideological positions unless explicitly present.",
    "Reflect life-stage (age group), role, archetype, temperament, and communication habits.",
    "Avoid stereotypes. Prefer neutral, respectful language.",
  ].join(" ");
}

/**
 * Build the user content (facts) for the persona description.
 */
function buildDescriptionUserContent(p: PersonaForAI): string {
  const lines: string[] = [];

  const name = p.name || p.nickname || "The persona";
  lines.push(`Name: ${name}`);

  const ageGroup = getTaxonomyTerm(p, "agegroup") || p.ageGroup || null;
  if (ageGroup) lines.push(`Age group: ${ageGroup}`);

  const archetype = getTaxonomyTerm(p, "archetype");
  if (archetype) lines.push(`Archetype: ${archetype}`);

  const profession = p.profession || getTaxonomyTerm(p, "profession");
  if (profession) lines.push(`Profession: ${profession}`);

  const temperament = p.temperament || getTaxonomyTerm(p, "temperament");
  if (temperament) lines.push(`Temperament: ${temperament}`);

  const tone = p.tone || getTaxonomyTerm(p, "tone");
  if (tone) lines.push(`Tone: ${tone}`);

  const conflictStyle = p.conflictStyle || getTaxonomyTerm(p, "conflictstyle");
  if (conflictStyle) lines.push(`Conflict style: ${conflictStyle}`);

  const vocabularyStyle = p.vocabularyStyle || getTaxonomyTerm(p, "vocabularystyle");
  if (vocabularyStyle) lines.push(`Vocabulary style: ${vocabularyStyle}`);

  const debateApproach = Array.isArray(p.debateApproach) ? p.debateApproach.filter(Boolean) : null;
  if (debateApproach?.length) lines.push(`Debate approach: ${debateApproach.join(", ")}`);

  const pronouns = p.pronouns;
  if (pronouns) lines.push(`Pronouns: ${pronouns}`);

  const genderIdentity = p.genderIdentity;
  if (genderIdentity) lines.push(`Gender identity: ${genderIdentity}`);

  const accentNote = p.accentNote;
  if (accentNote) lines.push(`Accent note: ${accentNote}`);

  return lines.join("\n");
}

/**
 * Call OpenAI Chat Completions for text description.
 * We keep this robust but minimal; callers handle persistence.
 */
export async function generatePersonaDescription(persona: PersonaForAI): Promise<{ description: string | null }> {
  assertApiKey();

  const sys = buildDescriptionSystemPrompt();
  const user = buildDescriptionUserContent(persona);

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      temperature: 0.6,
      max_tokens: 300,
    }),
  });

  if (!res.ok) {
    let msg = `OpenAI description error: ${res.status}`;
    try {
      const data = await res.json();
      msg = data?.error || msg;
    } catch {
      msg = await res.text();
    }
    throw new Error(msg);
  }

  const json: any = await res.json();
  const text: string | undefined =
    json?.choices?.[0]?.message?.content?.trim();

  return { ...persona, description: text || persona.description || null };
}

/* --------------------------------- AVATAR ---------------------------------- */

/**
 * Build a safe, bias-aware avatar prompt. We avoid inferring protected traits.
 * We encode age-range (from age group), gender *presentation*, role attire, and vibe.
 */
export function buildAvatarPrompt(persona: PersonaForAI): string {
  const displayName = persona?.name || persona?.nickname || "The persona";

  // Age group → age range hint
  const ageGroup = getTaxonomyTerm(persona, "agegroup") || persona.ageGroup;
  const ageHint =
    ageGroup?.includes("Teen") ? "looks about 16–19 years old" :
    ageGroup?.includes("Young Adult") ? "looks about 20–25 years old" :
    ageGroup?.includes("Adult") ? "looks about 30–35 years old" :
    ageGroup?.includes("Middle") ? "looks about 45–50 years old" :
    ageGroup?.includes("Senior") ? "looks about 65–70 years old" :
    "adult";

  // Gender *presentation* (don’t infer protected traits)
  const genderIdentity = persona.genderIdentity || getTaxonomyTerm(persona, "genderidentity") || "";
  const pronouns = persona.pronouns || "";
  const presentation = [genderIdentity, pronouns].filter(Boolean).join(", ") || "gender-neutral presentation";

  // Role / attire (non-branded)
  const profession = persona.profession || getTaxonomyTerm(persona, "profession") || "professional attire";
  const roleLine = `${profession.toLowerCase()}`;

  // Vibe from style fields and taxonomy
  const archetype = getTaxonomyTerm(persona, "archetype");
  const temper = persona.temperament || getTaxonomyTerm(persona, "temperament");
  const tone = persona.tone || getTaxonomyTerm(persona, "tone");
  const conflictStyle = persona.conflictStyle || getTaxonomyTerm(persona, "conflictstyle");
  const confidence = typeof persona.confidence === "number" ? persona.confidence : null;

  const vibe: string[] = [];
  if (archetype) vibe.push(archetype.toLowerCase());
  if (temper) vibe.push(temper.toLowerCase());
  if (tone) vibe.push(`${String(tone).toLowerCase()} tone`);
  if (confidence != null) vibe.push(confidence >= 7 ? "confident" : confidence <= 3 ? "reserved" : "composed");
  if (conflictStyle) vibe.push(`${String(conflictStyle).toLowerCase()} posture`);
  const vibeLine = vibe.length ? vibe.join(", ") : "calm, approachable";

  const background =
    "neutral studio background, soft key light, shallow depth of field, natural color grading";

  const instructions = [
    `Create a photorealistic head-and-shoulders portrait of ${displayName}.`,
    `Subject is ${presentation}, ${ageHint}.`,
    `Expression and posture reflect: ${vibeLine}.`,
    `Wardrobe: ${roleLine}; no logos or readable text.`,
    `Framing: centered headshot, eyes toward camera, gentle smile or neutral expression.`,
    `Background: ${background}.`,
    `Avoid stereotypes. Do not guess ethnicity, skin tone, religion, or politics.`,
    `Output: detailed, high-quality portrait suitable for a UI avatar.`,
  ];

  return instructions.join(" ");
}

/** Normalize size per model (avoid API rejections). */
function normalizeSizeForModel(model: string, requested: string): "1024x1024" | "1024x1792" | "1792x1024" {
  // dall-e-3 supports only these sizes (per your error log).
  // gpt-image-1 also accepts 1024 sizes widely; default to 1024x1024.
  const allowed = new Set(["1024x1024", "1024x1792", "1792x1024"]);
  if (allowed.has(requested)) return requested as any;
  return "1024x1024";
}

/**
 * Generate a photorealistic avatar image using OpenAI Images API.
 * Returns a data URL (PNG base64) or an https URL string, or null if disabled/fails.
 * Feature-flagged by AVATAR_AI_ENABLED to avoid unintended costs.
 */
export async function generatePersonaAvatar(
  persona: PersonaForAI,
  size: "512x512" | "768x768" | "1024x1024" | "1024x1792" | "1792x1024" = "1024x1024"
): Promise<string | null> {
  if (!process.env.AVATAR_AI_ENABLED) return null;
  assertApiKey();
  const prompt = buildAvatarPrompt(persona);

  // Per-model settings inferred from your runtime errors
  const models: Array<{
    name: "gpt-image-1" | "dall-e-3";
    supportsB64: boolean;
  }> = [
    { name: "gpt-image-1", supportsB64: false }, // returns URL, rejects response_format
    { name: "dall-e-3", supportsB64: true },     // accepts b64_json, limited sizes
  ];

  for (const { name, supportsB64 } of models) {
    const normalizedSize = normalizeSizeForModel(name, size);

    try {
      const body: any = { model: name, prompt, size: normalizedSize };
      if (supportsB64) {
        // Only include response_format where it's supported (dall-e-3)
        body.response_format = "b64_json";
      }

      const res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.warn(`[AI] avatar generation failed (${name}):`, res.status, errText);
        continue;
      }

      const json: any = await res.json();

      // Prefer b64_json when requested, else fallback to URL
      const b64 = json?.data?.[0]?.b64_json;
      if (supportsB64 && typeof b64 === "string" && b64.length) {
        return `data:image/png;base64,${b64}`;
      }

      const url = json?.data?.[0]?.url;
      if (typeof url === "string" && url.trim()) {
        return url.trim();
      }

      // If neither present, log and try next model
      console.warn(`[AI] avatar generation returned unexpected payload (${name}).`);
    } catch (e) {
      console.warn(`[AI] avatar generation exception (${name}):`, e);
    }
  }

  return null;
}