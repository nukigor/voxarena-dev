import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

// GET /api/taxonomycategories/:id
export async function GET(_req: Request, { params }: Params) {
  try {
    const item = await prisma.taxonomyCategory.findUnique({ where: { id: params.id } });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(item);
  } catch (e) {
    console.error("GET /api/taxonomycategories/[id] failed", e);
    return NextResponse.json({ error: "Failed to load category" }, { status: 500 });
  }
}

// PUT /api/taxonomycategories/:id
export async function PUT(req: Request, { params }: Params) {
  try {
    const body = await req.json();
    const { fullName, description, key } = body || {};
    if (!fullName || typeof fullName !== "string") {
      return NextResponse.json({ error: "Full name is required" }, { status: 400 });
    }

    const data: any = {
      fullName,
      description: description ?? null,
    };
    if (typeof key === "string" && key.trim() !== "") {
      data.key = key.trim();
    }

    const updated = await prisma.taxonomyCategory.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    const msg = e?.code === "P2002" ? "A category with this key or full name already exists" : "Failed to update category";
    console.error("PUT /api/taxonomycategories/[id] failed", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/taxonomycategories/:id
export async function DELETE(_req: Request, { params }: Params) {
  try {
    // find category to obtain its key
    const cat = await prisma.taxonomyCategory.findUnique({ where: { id: params.id } });
    if (!cat) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // First delete all taxonomy terms linked to this category
    await prisma.taxonomy.deleteMany({
      where: {
        OR: [
          { categoryId: params.id },
          { category: cat.key },
        ],
      },
    });

    // Then delete the category
    await prisma.taxonomyCategory.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/taxonomycategories/[id] failed", e);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}