import React, { useState } from 'react';
import {
  Copy,
  Check,
  Send,
  FileText,
  Trash2,
  RefreshCw,
  Terminal,
  ArrowUpRight,
  Search,
} from 'lucide-react';
import {
  InterceptorJob,
  InterceptorSource,
  BLUEPRINT_CONSTRAINTS,
} from '../types/apex';
import {
  updateDocument,
  deleteDocument,
  refreshCollectionFromServer,
} from '../lib/firebase';

interface Props {
  jobs: InterceptorJob[];
  ownerId: string;
}

const SCRAPER_PRESETS = [
  {
    label: 'n8n Webhook Cluster Failure ($4.8k)',
    source: 'playwright-scraper' as InterceptorSource,
    title: 'Production n8n Webhook Queue Dropping High-Volume Stripe & ERP Payloads',
    clientName: 'Kestrel Global Logistics',
    budget: '$4,800 Fixed + $1,200/mo Retainer',
    jobDescription:
      'Our self-hosted n8n instance on DigitalOcean drops 18% of inbound webhook payloads during peak afternoon syncs. PostgreSQL connections saturate and executions fail silently without retry. Need immediate Redis queue worker decoupling and dead-letter recovery.',
  },
  {
    label: 'Enterprise Knowledge Management OS ($9.2k)',
    source: 'playwright-scraper' as InterceptorSource,
    title: 'Multi-Agent Knowledge Management & Deterministic Context OS Required',
    clientName: 'Vortex Quantitative Partners',
    budget: '$9,200 Project Scope',
    jobDescription:
      'We have 2,100 unstructured investment memos and compliance SOPs across Notion and SharePoint. We need a unified Business Context OS that compiles SOPs into strict JSON schemas for autonomous underwriting agents with zero hallucination tolerance.',
  },
  {
    label: 'Patchright Stealth Scraper Pipeline ($3.5k)',
    source: 'n8n-alert' as InterceptorSource,
    title: 'Cloudflare Turnstile Blocking Headless Procurement Aggregator',
    clientName: 'Meridian Supply Chain Analytics',
    budget: '$3,500 Fixed Milestone',
    jobDescription:
      'Existing Playwright Python scripts are failing on procurement portals. Need migration to Patchright stealth runtime on dedicated DigitalOcean VPS with residential proxy rotation and direct JSON webhook delivery into our CRM.',
  },
];

export default function InterceptorFeedModule({ jobs, ownerId }: Props) {
  const [webhookToken, setWebhookToken] = useState('whk_apex_live_9941x');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [generatingJobId, setGeneratingJobId] = useState<string | null>(null);
  const [dispatchingWebhook, setDispatchingWebhook] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'intercepted' | 'proposal_ready' | 'dispatched'>('all');

  // Custom scraper payload form state
  const [title, setTitle] = useState(SCRAPER_PRESETS[0].title);
  const [clientName, setClientName] = useState(SCRAPER_PRESETS[0].clientName);
  const [budget, setBudget] = useState(SCRAPER_PRESETS[0].budget);
  const [source, setSource] = useState<InterceptorSource>('playwright-scraper');
  const [jobDescription, setJobDescription] = useState(SCRAPER_PRESETS[0].jobDescription);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const webhookEndpointUrl = `${origin}/api/webhooks/interceptor/${webhookToken}`;

  const copyText = async (key: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleRotateToken = () => {
    const randomSuffix = Math.random().toString(36).slice(2, 8);
    setWebhookToken(`whk_apex_${randomSuffix}`);
  };

  const handleApplyPreset = (preset: (typeof SCRAPER_PRESETS)[number]) => {
    setTitle(preset.title);
    setClientName(preset.clientName);
    setBudget(preset.budget);
    setSource(preset.source);
    setJobDescription(preset.jobDescription);
  };

  const handleDispatchWebhookPayload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !jobDescription.trim()) return;
    setDispatchingWebhook(true);
    setErrorMsg(null);
    try {
      const response = await fetch(`/api/webhooks/interceptor/${encodeURIComponent(webhookToken)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId,
          source,
          title: title.trim().slice(0, BLUEPRINT_CONSTRAINTS.INTERCEPTOR.TITLE_MAX),
          clientName: clientName.trim().slice(0, BLUEPRINT_CONSTRAINTS.INTERCEPTOR.CLIENT_MAX),
          budget: budget.trim().slice(0, BLUEPRINT_CONSTRAINTS.INTERCEPTOR.BUDGET_MAX),
          jobDescription: jobDescription.trim().slice(0, BLUEPRINT_CONSTRAINTS.INTERCEPTOR.DESC_MAX),
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Webhook receiver rejected payload');
      }
      await refreshCollectionFromServer('interceptorJobs', ownerId);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setDispatchingWebhook(false);
    }
  };

  const handleGenerateProposal = async (job: InterceptorJob) => {
    setGeneratingJobId(job.id);
    setErrorMsg(null);
    try {
      const response = await fetch('/api/gemini/proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          title: job.title,
          clientName: job.clientName,
          budget: job.budget,
          jobDescription: job.jobDescription,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate ROI proposal via Gemini');
      }
      await updateDocument<InterceptorJob>('interceptorJobs', job.id, {
        roiProposal: String(data.proposal || '').slice(
          0,
          BLUEPRINT_CONSTRAINTS.INTERCEPTOR.PROPOSAL_MAX
        ),
        status: 'proposal_ready',
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setGeneratingJobId(null);
    }
  };

  const handleMarkDispatched = async (job: InterceptorJob) => {
    await updateDocument<InterceptorJob>('interceptorJobs', job.id, {
      status: job.status === 'dispatched' ? 'proposal_ready' : 'dispatched',
    });
  };

  const handleDeleteJob = async (jobId: string) => {
    await deleteDocument('interceptorJobs', jobId, ownerId);
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    const q = searchFilter.trim().toLowerCase();
    const matchesQuery =
      !q ||
      job.title.toLowerCase().includes(q) ||
      job.clientName.toLowerCase().includes(q) ||
      job.jobDescription.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  const curlSnippet = `curl -X POST "${webhookEndpointUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{"source":"playwright-scraper","clientName":"${clientName}","budget":"${budget}","title":"${title}","jobDescription":"${jobDescription.slice(0, 90)}..."}'`;

  return (
    <div className="space-y-8">
      {/* Header & Webhook Endpoint Bar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-slate-800">
        <div>
          <p className="text-xs font-mono text-cyan-400 tracking-wide">
            01 · REAL-TIME SCRAPER WEBHOOK & GEMINI ROI ENGINE
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-50 mt-1 tracking-tight">
            The Interceptor Feed
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Ingests live JSON job payloads from external Python Playwright / Patchright scrapers and synthesizes plain-text, ROI-anchored executive proposals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs font-mono tabular-nums text-slate-300">
          <div>
            <span className="text-slate-500">Total Intercepted: </span>
            <span className="text-slate-100 font-semibold">{jobs.length}</span>
          </div>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <div>
            <span className="text-slate-500">Proposals Ready: </span>
            <span className="text-emerald-400 font-semibold">
              {jobs.filter((j) => j.status === 'proposal_ready' || j.status === 'dispatched').length}
            </span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-950/50 border border-red-800/80 rounded-lg text-sm text-red-200 flex items-center justify-between gap-4">
          <span>Error: {errorMsg}</span>
          <button
            onClick={() => setErrorMsg(null)}
            className="px-3 py-1 text-xs font-medium bg-red-900/60 hover:bg-red-800 rounded text-red-100 whitespace-nowrap shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Webhook Receiver Endpoint & Simulator Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Left: Live Webhook Endpoint & Playwright Integration Spec */}
        <div className="xl:col-span-5 bg-slate-900/90 border border-slate-800 rounded-lg p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold text-slate-100">
                Active Webhook Receiver Endpoint
              </h2>
              <button
                type="button"
                onClick={handleRotateToken}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Rotate Token
              </button>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-md flex items-center justify-between gap-3">
              <code className="text-xs font-mono text-cyan-300 truncate select-all">
                {webhookEndpointUrl}
              </code>
              <button
                type="button"
                onClick={() => copyText('endpoint', webhookEndpointUrl)}
                className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-100 rounded transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                {copiedKey === 'endpoint' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy URL
                  </>
                )}
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">
                  Playwright / cURL Dispatch Command
                </span>
                <button
                  type="button"
                  onClick={() => copyText('curl', curlSnippet)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  {copiedKey === 'curl' ? 'Copied Snippet' : 'Copy cURL'}
                </button>
              </div>
              <pre className="p-3 bg-slate-950 border border-slate-800/80 rounded-md text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
                {curlSnippet}
              </pre>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
            <span>Method: HTTP POST (JSON)</span>
            <span aria-hidden="true">·</span>
            <span>Persistence: Firestore + Disk Sync</span>
          </div>
        </div>

        {/* Right: Built-in Scraper Webhook Payload Dispatcher */}
        <form
          onSubmit={handleDispatchWebhookPayload}
          className="xl:col-span-7 bg-slate-900/90 border border-slate-800 rounded-lg p-6 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Built-In Scraper Payload Dispatcher
              </h2>
              <p className="text-xs text-slate-400">
                Simulate an inbound Python Playwright scrape or dispatch a live high-ticket lead directly to the webhook receiver.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {SCRAPER_PRESETS.map((preset, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors whitespace-nowrap shrink-0"
                >
                  Preset {i + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Client Organization</label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Contract Budget</label>
              <input
                type="text"
                required
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-950 border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Payload Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as InterceptorSource)}
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="playwright-scraper">playwright-scraper</option>
                <option value="n8n-alert">n8n-alert</option>
                <option value="test-dispatcher">test-dispatcher</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Scraped Requirement Headline</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Technical Problem Description (Sent to Gemini ROI Engine)
            </label>
            <textarea
              rows={3}
              required
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center justify-end pt-1">
            <button
              type="submit"
              disabled={dispatchingWebhook}
              className="px-4 py-2 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-md transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {dispatchingWebhook ? 'Dispatching to Webhook...' : 'Dispatch Webhook Payload'}
            </button>
          </div>
        </form>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg w-fit">
          {(['all', 'intercepted', 'proposal_ready', 'dispatched'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                statusFilter === st
                  ? 'bg-cyan-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              {st === 'all'
                ? 'All Jobs'
                : st === 'intercepted'
                  ? 'Intercepted'
                  : st === 'proposal_ready'
                    ? 'Proposal Ready'
                    : 'Dispatched'}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter jobs or clients..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Live Intercepted Feed List */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <div className="p-12 bg-slate-900/60 border border-slate-800 rounded-lg text-center space-y-3">
            <Terminal className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-sm font-medium text-slate-200">
              No intercepted jobs match the active filter.
            </p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Use the Built-In Scraper Payload Dispatcher above or send a POST request from your Python Playwright script to populate the feed.
            </p>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-slate-900/90 border border-slate-800 rounded-lg p-6 space-y-4 transition-colors hover:border-slate-700"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="space-y-1.5">
                  {/* Zero-Pill Unboxed Metadata */}
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono tabular-nums text-slate-400">
                    <span className="text-cyan-400 font-medium">{job.clientName}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-400 font-semibold">{job.budget}</span>
                    <span aria-hidden="true">·</span>
                    <span>Source: {job.source}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      Status:{' '}
                      <strong
                        className={
                          job.status === 'proposal_ready' || job.status === 'dispatched'
                            ? 'text-emerald-400 font-medium'
                            : 'text-amber-400 font-medium'
                        }
                      >
                        {job.status}
                      </strong>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>

                  <h3 className="text-lg font-semibold text-slate-50">{job.title}</h3>
                  <p className="text-sm text-slate-300 leading-relaxed max-w-4xl">
                    {job.jobDescription}
                  </p>
                </div>

                {/* Action Controls */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    disabled={generatingJobId === job.id}
                    onClick={() => handleGenerateProposal(job)}
                    className="px-4 py-2 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-md transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {generatingJobId === job.id ? 'Synthesizing ROI Proposal...' : 'Generate Proposal'}
                  </button>

                  {job.roiProposal && (
                    <button
                      type="button"
                      onClick={() => handleMarkDispatched(job)}
                      className="px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                      {job.status === 'dispatched' ? 'Marked Dispatched' : 'Mark Dispatched'}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteJob(job.id)}
                    className="p-2 text-slate-400 hover:text-red-400 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors"
                    title="Delete Job"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Generated Gemini-Proof Plain Text Proposal Output */}
              {job.roiProposal && (
                <div className="pt-4 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-mono text-emerald-400">
                      GEMINI-PROOF PLAIN TEXT ROI PROPOSAL
                    </span>
                    <button
                      type="button"
                      onClick={() => copyText(`prop_${job.id}`, job.roiProposal)}
                      className="px-3 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-100 rounded inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                    >
                      {copiedKey === `prop_${job.id}` ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          Copied Plain Text
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy Plain-Text Proposal
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 bg-slate-950 border border-slate-800 rounded-md text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed select-all">
                    {job.roiProposal}
                  </pre>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
