import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAuthenticated, requireAuth } from "@/lib/route-auth";

const companySchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().trim().min(1).max(160),
  domain: z.string().trim().max(180).optional(),
  notes: z.string().max(5000).optional(),
});

function organizationId(request: NextRequest, body?: unknown) {
  const header = request.headers.get("x-organization-id");
  if (header) return header;
  if (body && typeof body === "object" && body !== null && "organizationId" in body) {
    const value = (body as { organizationId?: unknown }).organizationId;
    return typeof value === "string" ? value : null;
  }
  return null;
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, "customers:read");
  if (!isAuthenticated(auth)) return auth;
  const orgId = organizationId(request);
  if (!orgId) return NextResponse.json({ error: "X-Organization-Id is required" }, { status: 400 });
  const companies = await prisma.company.findMany({
    where: { organizationId: orgId },
    include: { customers: { select: { id: true, name: true, email: true, phone: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(companies);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, "customers:write");
  if (!isAuthenticated(auth)) return auth;
  const body = await request.json();
  const parsed = companySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid company", details: parsed.error.flatten() }, { status: 400 });
  const company = await prisma.company.create({ data: { ...parsed.data, domain: parsed.data.domain || "", notes: parsed.data.notes || "" } });
  return NextResponse.json(company, { status: 201 });
}
