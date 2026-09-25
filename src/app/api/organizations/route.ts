import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAuthenticated, requireAuth } from "@/lib/route-auth";

const schema = z.object({ name: z.string().trim().min(2).max(120) });

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "workspace";
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, "customers:read");
  if (!isAuthenticated(auth)) return auth;
  const memberships = await prisma.organizationMember.findMany({ where: { adminId: auth.userId }, include: { organization: true }, orderBy: { createdAt: "asc" } });
  return NextResponse.json(memberships.map(({ organization, role }) => ({ ...organization, role })));
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, "customers:write");
  if (!isAuthenticated(auth)) return auth;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "A workspace name is required" }, { status: 400 });
  const base = slugify(parsed.data.name);
  const slug = `${base}-${crypto.randomUUID().slice(0, 8)}`;
  const organization = await prisma.organization.create({ data: { name: parsed.data.name, slug, members: { create: { adminId: auth.userId, role: "owner" } } }, include: { members: true } });
  return NextResponse.json(organization, { status: 201 });
}
