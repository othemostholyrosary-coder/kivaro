"use client";

import { FormEvent, useEffect, useState } from "react";
import { Building2, Plus, RefreshCw } from "lucide-react";
import { Header } from "@/components/layout/header";

interface Organization { id: string; name: string; role: string }
interface Company { id: string; name: string; domain: string; notes: string; customers: { id: string; name: string; email: string }[] }

export default function CompaniesPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadOrganizations() {
    const response = await fetch("/api/organizations");
    if (!response.ok) return;
    const data = await response.json();
    setOrganizations(data);
    const saved = localStorage.getItem("kivaro-organization-id");
    const selected = data.some((item: Organization) => item.id === saved) ? saved : data[0]?.id || "";
    setOrganizationId(selected);
    if (selected) localStorage.setItem("kivaro-organization-id", selected);
  }
  async function loadCompanies(id = organizationId) {
    if (!id) { setLoading(false); return; }
    setLoading(true);
    const response = await fetch("/api/companies", { headers: { "X-Organization-Id": id } });
    if (response.ok) setCompanies(await response.json());
    setLoading(false);
  }
  useEffect(() => { loadOrganizations().catch(() => setLoading(false)); }, []);
  useEffect(() => { if (organizationId) loadCompanies().catch(() => setLoading(false)); }, [organizationId]);

  async function createCompany(event: FormEvent) {
    event.preventDefault();
    if (!organizationId || !name.trim()) return;
    const response = await fetch("/api/companies", { method: "POST", headers: { "Content-Type": "application/json", "X-Organization-Id": organizationId }, body: JSON.stringify({ organizationId, name, domain }) });
    if (response.ok) { setName(""); setDomain(""); setMessage("Company added"); await loadCompanies(); }
    else setMessage("Could not add company");
  }

  return <div className="flex flex-col h-full"><Header title="Companies" subtitle="B2B accounts, contacts and relationship context" /><main className="flex-1 overflow-auto p-6 space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold text-kivaro-text">B2B companies</h2><p className="text-sm text-kivaro-text-light">Keep company-level context alongside individual customer conversations.</p></div><div className="flex gap-2"><select value={organizationId} onChange={(event) => { setOrganizationId(event.target.value); localStorage.setItem("kivaro-organization-id", event.target.value); }} className="rounded-lg border border-kivaro-border bg-kivaro-surface px-3 py-2 text-sm">{organizations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button onClick={() => loadCompanies()} className="rounded-lg border border-kivaro-border p-2 text-kivaro-text-light" title="Refresh"><RefreshCw className="h-4 w-4" /></button></div></div>
    <form onSubmit={createCompany} className="grid gap-3 rounded-xl border border-kivaro-border bg-kivaro-surface p-4 md:grid-cols-[1fr_1fr_auto]"><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Company name" className="rounded-lg border border-kivaro-border bg-kivaro-bg px-3 py-2 text-sm" required /><input value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="Domain (optional)" className="rounded-lg border border-kivaro-border bg-kivaro-bg px-3 py-2 text-sm" /><button className="inline-flex items-center justify-center gap-2 rounded-lg bg-kivaro-primary px-4 py-2 text-sm font-medium text-white"><Plus className="h-4 w-4" />Add company</button></form>
    {message && <p className="text-sm text-kivaro-text-light">{message}</p>}
    {loading ? <p className="text-sm text-kivaro-text-light">Loading companies...</p> : companies.length === 0 ? <div className="rounded-xl border border-dashed border-kivaro-border p-10 text-center"><Building2 className="mx-auto mb-3 h-8 w-8 text-kivaro-primary" /><p className="font-medium text-kivaro-text">No companies yet</p><p className="mt-1 text-sm text-kivaro-text-light">Add a B2B account to start organizing contacts and support history.</p></div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{companies.map((company) => <article key={company.id} className="rounded-xl border border-kivaro-border bg-kivaro-surface p-5"><div className="flex items-start justify-between"><div><h3 className="font-semibold text-kivaro-text">{company.name}</h3><p className="text-sm text-kivaro-text-light">{company.domain || "No domain"}</p></div><Building2 className="h-5 w-5 text-kivaro-primary" /></div><p className="mt-5 text-sm text-kivaro-text-light">{company.customers.length} linked contact{company.customers.length === 1 ? "" : "s"}</p><div className="mt-3 space-y-1">{company.customers.slice(0, 3).map((contact) => <p key={contact.id} className="text-sm text-kivaro-text">{contact.name} <span className="text-kivaro-text-light">{contact.email}</span></p>)}</div></article>)}</div>}
  </main></div>;
}
