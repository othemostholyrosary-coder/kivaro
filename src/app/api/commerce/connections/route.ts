import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAuthenticated, requireAuth } from "@/lib/route-auth";

const connectionSchema = z.object({
  organizationId: z.string().uuid(),
  provider: z.enum(["shopify", "woocommerce"]),
  name: z.string().trim().min(1).max(120),
  storeUrl: z.string().url(),
});

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, "channels:read");
  if (!isAuthenticated(auth)) return auth;
  const organizationId = request.headers.get("x-organization-id");
  if (!organizationId) return NextResponse.json({ error: "X-Organization-Id is required" }, { status: 400 });
  const connections = await prisma.commerceConnection.findMany({
    where: { organizationId },
    select: { id: true, provider: true, name: true, storeUrl: true, status: true, isActive: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(connections);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, "channels:update");
  if (!isAuthenticated(auth)) return auth;
  const parsed = connectionSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid commerce connection", details: parsed.error.flatten() }, { status: 400 });
  const connection = await prisma.commerceConnection.upsert({
    where: { organizationId_provider_storeUrl: parsed.data },
    update: { name: parsed.data.name, isActive: true },
    create: { ...parsed.data, credentials: {}, status: "pending" },
    select: { id: true, provider: true, name: true, storeUrl: true, status: true, isActive: true, createdAt: true, updatedAt: true },
  });
  return NextResponse.json(connection, { status: 201 });
}
