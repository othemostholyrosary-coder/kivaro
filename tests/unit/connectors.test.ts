import { describe, expect, it, vi } from "vitest";
import { callUserConnector } from "@/lib/connectors";

describe("user-owned connectors", () => {
  const manifest = {
    id: "erp-demo",
    name: "Demo ERP",
    version: "1.0.0",
    endpoint: "https://connector.example/run",
    capabilities: ["lookup_customer"],
    requiresApproval: true,
  };

  it("requires approval for declared actions", async () => {
    await expect(callUserConnector({ manifest, action: "lookup_customer", input: {}, approved: false }))
      .rejects.toThrow("requires explicit approval");
  });

  it("rejects undeclared or unsafe actions before network access", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(callUserConnector({ ...{ manifest: { ...manifest, endpoint: "http://localhost/run" } }, action: "lookup_customer", input: {}, approved: true }))
      .rejects.toThrow("HTTPS");
    await expect(callUserConnector({ manifest, action: "delete_everything", input: {}, approved: true }))
      .rejects.toThrow("does not declare capability");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
