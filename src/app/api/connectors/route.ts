import { NextRequest, NextResponse } from "next/server";
import { callUserConnector, connectorCallSchema } from "@/lib/connectors";
import { isAuthenticated, requireAuth } from "@/lib/route-auth";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, "webhooks:write");
  if (!isAuthenticated(auth)) return auth;

  try {
    const parsed = connectorCallSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid connector request", details: parsed.error.flatten() }, { status: 400 });
    }
    const result = await callUserConnector(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Connector request failed" }, { status: 502 });
  }
}
