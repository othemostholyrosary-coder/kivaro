import { z } from "zod";

export const connectorManifestSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(120),
  version: z.string().min(1).max(40),
  description: z.string().max(500).optional(),
  endpoint: z.string().url(),
  capabilities: z.array(z.string().min(1).max(80)).max(100),
  requiresApproval: z.boolean().default(true),
});

export const connectorCallSchema = z.object({
  manifest: connectorManifestSchema,
  action: z.string().min(1).max(100),
  input: z.record(z.string(), z.unknown()).default({}),
  approved: z.boolean().default(false),
});

export type ConnectorManifest = z.infer<typeof connectorManifestSchema>;
export type ConnectorCall = z.infer<typeof connectorCallSchema>;

function isSafeEndpoint(endpoint: string) {
  const url = new URL(endpoint);
  return url.protocol === "https:" && !["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(url.hostname);
}

export async function callUserConnector(call: ConnectorCall) {
  if (!isSafeEndpoint(call.manifest.endpoint)) {
    throw new Error("Connector endpoints must use HTTPS and cannot target localhost");
  }
  if (call.manifest.requiresApproval && !call.approved) {
    throw new Error("This connector action requires explicit approval");
  }
  if (!call.manifest.capabilities.includes(call.action)) {
    throw new Error(`Connector does not declare capability: ${call.action}`);
  }

  const response = await fetch(call.manifest.endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      protocol: "kivaro-connector/v1",
      connector: { id: call.manifest.id, version: call.manifest.version },
      action: call.action,
      input: call.input,
    }),
    cache: "no-store",
  });

  const text = await response.text();
  let data: unknown = text;
  try { data = JSON.parse(text); } catch { /* connector returned plain text */ }
  if (!response.ok) throw new Error(`Connector failed (${response.status})`);
  return { status: response.status, data };
}
