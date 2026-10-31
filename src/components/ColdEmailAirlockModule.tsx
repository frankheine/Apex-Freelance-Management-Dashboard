import React, { useState, useRef } from 'react';
import {
  Upload,
  ShieldCheck,
  Download,
  Trash2,
  Plus,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ColdLead,
  BurnerDomain,
  BLUEPRINT_CONSTRAINTS,
} from '../types/apex';
import {
  createDocument,
  deleteDocument,
  refreshCollectionFromServer,
} from '../lib/firebase';

interface Props {
  leads: ColdLead[];
  ownerId: string;
}

const APOLLO_CSV_SAMPLE = `email,first_name,last_name,company,job_title,hiring_signal
r.thornton@atlasfreightcorp.com,Rachel,Thornton,Atlas Freight Corp,Director of Operations,Hiring 3x Manual Data Entry Associates (BOL & Customs)
catchall-hr@omniwarehousing-legacy.org,Greg,Halvorsen,Omni Warehousing Legacy,HR Director,Hiring Manual Inventory Entry Clerk
k.nakamura@precisionmedbilling.io,Kenji,Nakamura,Precision MedBilling,VP of Claims,Hiring Manual ICD-10 Data Entry Specialist
invalid-bounce@defunct-enterprise.invalid,Tom,Bradley,Defunct Enterprise,Office Manager,Hiring Manual Spreadsheet Entry Assistant
s.lindqvist@nordiccustoms.net,Soren,Lindqvist,Nordic Customs Brokerage,Head of Compliance,Hiring Manual Tariff Data Entry Operator`;

export default function ColdEmailAirlockModule({ leads, ownerId }: Props) {
  const [customWebhookUrl, setCustomWebhookUrl] = useState('');
  const [scrubbing, setScrubbing] = useState(false);
  const [scrubSummary, setScrubSummary] = useState<{
    validCount: number;
    deletedCount: number;
    deletedLeads: { email: string; company: string; reason: string }[];
  } | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [firstNameInput, setFirstNameInput] = useState('');
  const [lastNameInput, setLastNameInput] = useState('');
  const [companyInput, setCompanyInput] = useState('');
  const [jobTitleInput, setJobTitleInput] = useState('VP of Operations');
  const [hiringSignalInput, setHiringSignalInput] = useState(
    'Hiring Manual Data Entry Clerk (Apollo Signal)'
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const parseAndIngestCsv = async (csvText: string) => {
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) return;

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const domains = BLUEPRINT_CONSTRAINTS.COLD_LEAD.BURNER_DOMAINS;

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim());
      if (cols.length < 2) continue;

      const emailIdx = headers.findIndex((h) => h.includes('email'));
      const fnIdx = headers.findIndex((h) => h.includes('first'));
      const lnIdx = headers.findIndex((h) => h.includes('last'));
      const compIdx = headers.findIndex((h) => h.includes('company'));
      const titleIdx = headers.findIndex((h) => h.includes('title'));
      const sigIdx = headers.findIndex((h) => h.includes('signal') || h.includes('hiring'));

      const email = (cols[emailIdx >= 0 ? emailIdx : 0] || '').slice(0, 180);
      if (!email) continue;

      const id = `lead_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`;
      const assignedBurnerDomain: BurnerDomain = domains[(leads.length + i) % domains.length];

      await createDocument<ColdLead>('coldLeads', id, {
        ownerId,
        email,
        firstName: (cols[fnIdx >= 0 ? fnIdx : 1] || 'Executive').slice(0, 100),
        lastName: (cols[lnIdx >= 0 ? lnIdx : 2] || 'Contact').slice(0, 100),
        company: (cols[compIdx >= 0 ? compIdx : 3] || 'Enterprise Target').slice(0, 160),
        jobTitle: (cols[titleIdx >= 0 ? titleIdx : 4] || 'Operations Director').slice(0, 160),
        hiringSignal: (
          cols[sigIdx >= 0 ? sigIdx : 5] || 'Hiring Manual Data Entry Personnel'
        ).slice(0, 240),
        verificationStatus: 'Pending Airlock',
        assignedBurnerDomain,
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    await parseAndIngestCsv(text);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLoadSampleApolloBatch = async () => {
    await parseAndIngestCsv(APOLLO_CSV_SAMPLE);
  };

  const handleAddSingleLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !companyInput.trim()) return;
    const domains = BLUEPRINT_CONSTRAINTS.COLD_LEAD.BURNER_DOMAINS;
    const assignedBurnerDomain = domains[leads.length % domains.length];
    const id = `lead_${Date.now()}`;

    await createDocument<ColdLead>('coldLeads', id, {
      ownerId,
      email: emailInput.trim().slice(0, 180),
      firstName: (firstNameInput.trim() || 'Operations').slice(0, 100),
      lastName: (lastNameInput.trim() || 'Lead').slice(0, 100),
      company: companyInput.trim().slice(0, 160),
      jobTitle: jobTitleInput.trim().slice(0, 160),
      hiringSignal: hiringSignalInput.trim().slice(0, 240),
      verificationStatus: 'Pending Airlock',
      assignedBurnerDomain,
    });

    setEmailInput('');
    setFirstNameInput('');
    setLastNameInput('');
    setCompanyInput('');
  };

  const handleRunAirlockScrub = async () => {
    setScrubbing(true);
    try {
      const response = await fetch('/api/n8n/verify-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customWebhookUrl: customWebhookUrl.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setScrubSummary({
          validCount: data.validCount,
          deletedCount: data.deletedCount,
          deletedLeads: data.deletedLeads || [],
        });
        await refreshCollectionFromServer('coldLeads', ownerId);
      }
    } finally {
      setScrubbing(false);
    }
  };

  const handleExportSmartleadCsv = () => {
    const validLeads = leads.filter((l) => l.verificationStatus === 'Valid');
    const csvRows = [
      [
        'email',
        'first_name',
        'last_name',
        'company_name',
        'job_title',
        'custom_hiring_signal',
        'sending_burner_domain',
        'verification_status',
      ].join(','),
      ...validLeads.map((l) =>
        [
          `"${l.email.replace(/"/g, '""')}"`,
          `"${l.firstName.replace(/"/g, '""')}"`,
          `"${l.lastName.replace(/"/g, '""')}"`,
          `"${l.company.replace(/"/g, '""')}"`,
          `"${l.jobTitle.replace(/"/g, '""')}"`,
          `"${l.hiringSignal.replace(/"/g, '""')}"`,
          `"${l.assignedBurnerDomain}"`,
          `"Valid"`,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Smartlead_Verified_Burner_Export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const validLeadsCount = leads.filter((l) => l.verificationStatus === 'Valid').length;
  const pendingLeadsCount = leads.filter((l) => l.verificationStatus === 'Pending Airlock').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-slate-800">
        <div>
          <p className="text-xs font-mono text-cyan-400 tracking-wide">
            03 · APOLLO.IO INGESTION · MILLIONVERIFIER / N8N AIRLOCK · SMARTLEAD BURNER ROUTING
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-50 mt-1 tracking-tight">
            Cold Email Infrastructure & Verification Airlock
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Ingests Apollo.io CSV exports filtered for companies hiring manual data entry, automatically purges Catch-All and Invalid records, and distributes verified leads across three secondary burner domains.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-mono tabular-nums">
          <span>
            Pending Airlock: <strong className="text-amber-400">{pendingLeadsCount}</strong>
          </span>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <span>
            Smartlead Ready: <strong className="text-emerald-400">{validLeadsCount}</strong>
          </span>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <span>Burner Veil Domains: <strong className="text-cyan-400">3 Active</strong></span>
        </div>
      </div>

      {/* Controls Grid: CSV Upload + n8n/MillionVerifier Airlock Scrub */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left: Apollo.io CSV Upload & Manual Entry */}
        <div className="xl:col-span-6 bg-slate-900/90 border border-slate-800 rounded-lg p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Apollo.io CSV Upload (Manual Data Entry Signals)
              </h2>
              <p className="text-xs text-slate-400">
                Upload raw Apollo CSV or load a sample batch containing Valid, Catch-All, and Invalid rows.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-md transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Apollo CSV
              </button>
              <button
                type="button"
                onClick={handleLoadSampleApolloBatch}
                className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-md transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
                Load Apollo Sample Batch
              </button>
            </div>
          </div>

          <form onSubmit={handleAddSingleLead} className="pt-4 border-t border-slate-800 space-y-3">
            <span className="block text-xs font-medium text-slate-300">
              Append Individual Prospect to Airlock Queue
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="email"
                required
                placeholder="email@company.com (or catchall@...)"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-cyan-500"
              />
              <input
                type="text"
                required
                placeholder="Company Name"
                value={companyInput}
                onChange={(e) => setCompanyInput(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-cyan-500"
              />
              <input
                type="text"
                placeholder="First Name"
                value={firstNameInput}
                onChange={(e) => setFirstNameInput(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-cyan-500"
              />
              <input
                type="text"
                placeholder="Hiring Signal (e.g., Manual Invoice Entry)"
                value={hiringSignalInput}
                onChange={(e) => setHiringSignalInput(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-md inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Stage Prospect in Airlock
              </button>
            </div>
          </form>
        </div>

        {/* Right: Verification Airlock & Burner Domain Distribution */}
        <div className="xl:col-span-6 bg-slate-900/90 border border-slate-800 rounded-lg p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-100">
                MillionVerifier & n8n Verification Airlock
              </h2>
              <span className="text-xs font-mono text-emerald-400">
                Auto-Deletes Catch-All & Invalid
              </span>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Custom n8n MillionVerifier Webhook Route (Optional Override)
              </label>
              <input
                type="url"
                placeholder="https://n8n.yourdomain.com/webhook/millionverifier-airlock"
                value={customWebhookUrl}
                onChange={(e) => setCustomWebhookUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-md space-y-2">
              <span className="text-xs text-slate-400 block">
                Secondary Burner Domains Protecting Primary Corporate Veil:
              </span>
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-cyan-300">
                <span>1. ops-apexroute.io</span>
                <span aria-hidden="true" className="text-slate-700">·</span>
                <span>2. cyber-relay.net</span>
                <span aria-hidden="true" className="text-slate-700">·</span>
                <span>3. automate-veil.org</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              disabled={scrubbing || leads.length === 0}
              onClick={handleRunAirlockScrub}
              className="px-4 py-2.5 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-md transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              {scrubbing ? 'Scrubbing via Airlock...' : 'Run Verification Airlock Scrub'}
            </button>

            <button
              type="button"
              disabled={validLeadsCount === 0}
              onClick={handleExportSmartleadCsv}
              className="px-4 py-2.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-md transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Export Clean Smartlead CSV ({validLeadsCount})
            </button>
          </div>
        </div>
      </div>

      {/* Airlock Purge Report Banner */}
      {scrubSummary && (
        <div className="p-4 bg-slate-900 border border-emerald-500/40 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-emerald-400 font-semibold">
              AIRLOCK SCRUB COMPLETE · {scrubSummary.validCount} VALID RETAINED · {scrubSummary.deletedCount} PURGED FROM DATABASE
            </span>
            <button
              type="button"
              onClick={() => setScrubSummary(null)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Clear Log
            </button>
          </div>
          {scrubSummary.deletedLeads.length > 0 && (
            <div className="text-xs font-mono text-slate-300 space-y-1">
              {scrubSummary.deletedLeads.map((dl, idx) => (
                <div key={idx} className="flex items-center gap-2 text-red-300">
                  <span>[DELETED: {dl.reason}]</span>
                  <span>{dl.email}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-slate-400">{dl.company}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* High-Density Lead Routing Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-xs font-mono text-slate-400">
                <th className="py-3 px-4">Prospect & Email</th>
                <th className="py-3 px-4">Company & Role</th>
                <th className="py-3 px-4">Apollo Hiring Signal</th>
                <th className="py-3 px-4">Verification Airlock</th>
                <th className="py-3 px-4">Burner Domain Route</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-sm">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-100">
                      {lead.firstName} {lead.lastName}
                    </div>
                    <div className="text-xs font-mono text-cyan-300">{lead.email}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-slate-200">{lead.company}</div>
                    <div className="text-xs text-slate-400">{lead.jobTitle}</div>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-300 max-w-xs">
                    {lead.hiringSignal}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs tabular-nums">
                    <span
                      className={
                        lead.verificationStatus === 'Valid'
                          ? 'text-emerald-400 font-semibold'
                          : 'text-amber-400 font-medium'
                      }
                    >
                      {lead.verificationStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-300">
                    {lead.assignedBurnerDomain}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => deleteDocument('coldLeads', lead.id, ownerId)}
                      className="p-1.5 text-slate-400 hover:text-red-400 rounded transition-colors"
                      title="Delete Lead"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
