"use client";

import { FormEvent, useEffect, useState } from "react";
import { RefreshCw, Store } from "lucide-react";
import { Header } from "@/components/layout/header";

interface Organization { id: string; name: string }
interface Connection { id: string; provider: string; name: string; storeUrl: string; status: string; isActive: boolean }

export default function StoresPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [connections, setConnections] = useState<Connection[]>([]);
  const [form, setForm] = useState({ provider: "shopify", name: "", storeUrl: "" });
  const [message, setMessage] = useState("");

  async function load() {
    const orgResponse = await fetch("/api/organizations");
    if (!orgResponse.ok) return;
    const orgs = await orgResponse.json();
    setOrganizations(orgs);
    const selected = localStorage.getItem("kivaro-organization-id") || orgs[0]?.id || "";
    setOrganizationId(selected);
    if (!selected) return;
    localStorage.setItem("kivaro-organization-id", selected);
    const response = await fetch("/api/commerce/connections", { headers: { "X-Organization-Id": selected } });
    if (response.ok) setConnections(await response.json());
  }
  useEffect(() => { load().catch(() => setMessage("Could not load store connections")); }, []);

  async function addConnection(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/commerce/connections", { method: "POST", headers: { "Content-Type": "application/json", "X-Organization-Id": organizationId }, body: JSON.stringify({ ...form, organizationId }) });
    if (response.ok) { setForm({ ...form, name: "", storeUrl: "" }); setMessage("Store connection saved"); await load(); }
    else setMessage("Could not save store connection");
  }

  return <div className="flex flex-col h-full"><Header title="Stores" subtitle="Commerce context for e-commerce and B2B support" /><main className="flex-1 overflow-auto p-6 space-y-6"><div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-semibold text-kivaro-text">Commerce connections</h2><p className="text-sm text-kivaro-text-light">Connect Shopify or WooCommerce without storing access credentials in Kivaro.</p></div><div className="flex gap-2"><select value={organizationId} onChange={(event) => { setOrganizationId(event.target.value); localStorage.setItem("kivaro-organization-id", event.target.value); }} className="rounded-lg border border-kivaro-border bg-kivaro-surface px-3 py-2 text-sm">{organizations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}</select><button onClick={() => load()} className="rounded-lg border border-kivaro-border p-2 text-kivaro-text-light"><RefreshCw className="h-4 w-4" /></button></div></div><form onSubmit={addConnection} className="grid gap-3 rounded-xl border border-kivaro-border bg-kivaro-surface p-4 md:grid-cols-[160px_1fr_1fr_auto]"><select value={form.provider} onChange={(event) => setForm({ ...form, provider: event.target.value })} className="rounded-lg border border-kivaro-border bg-kivaro-bg px-3 py-2 text-sm"><option value="shopify">Shopify</option><option value="woocommerce">WooCommerce</option></select><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Store name" className="rounded-lg border border-kivaro-border bg-kivaro-bg px-3 py-2 text-sm" required /><input value={form.storeUrl} onChange={(event) => setForm({ ...form, storeUrl: event.target.value })} placeholder="https://store.example" type="url" className="rounded-lg border border-kivaro-border bg-kivaro-bg px-3 py-2 text-sm" required /><button className="rounded-lg bg-kivaro-primary px-4 py-2 text-sm font-medium text-white">Add store</button></form>{message && <p className="text-sm text-kivaro-text-light">{message}</p>}<div className="grid gap-4 md:grid-cols-2">{connections.map((connection) => <article key={connection.id} className="flex items-center gap-4 rounded-xl border border-kivaro-border bg-kivaro-surface p-5"><div className="rounded-lg bg-kivaro-primary-50 p-3"><Store className="h-5 w-5 text-kivaro-primary" /></div><div className="min-w-0 flex-1"><h3 className="font-semibold text-kivaro-text">{connection.name}</h3><p className="truncate text-sm text-kivaro-text-light">{connection.provider} · {connection.storeUrl}</p></div><span className="rounded-full bg-kivaro-primary-50 px-2 py-1 text-xs font-medium text-kivaro-primary">{connection.status}</span></article>)}{connections.length === 0 && <div className="rounded-xl border border-dashed border-kivaro-border p-10 text-center text-sm text-kivaro-text-light md:col-span-2">No commerce connections yet.</div>}</div></main></div>;
}
