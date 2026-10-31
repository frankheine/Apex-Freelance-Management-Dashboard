import React, { useState } from 'react';
import {
  Copy,
  Check,
  GitBranch,
  DownloadCloud,
  Trash2,
  ExternalLink,
  Code2,
  BookOpen,
} from 'lucide-react';
import { ArbitrageRepo } from '../types/apex';
import {
  createDocument,
  deleteDocument,
  refreshCollectionFromServer,
} from '../lib/firebase';

interface Props {
  repos: ArbitrageRepo[];
  ownerId: string;
}

const TARGET_REPOS = [
  {
    slug: 'business-context-os',
    label: 'business-context-os',
    category: 'Enterprise Context OS',
    description: 'Deterministic SOP & executive context kernel for autonomous LLM deployments.',
  },
  {
    slug: 'haih-net/agent',
    label: 'haih-net/agent',
    category: 'Autonomous Agent Runtime',
    description: 'Stateful agent harness with Patchright stealth & webhook callback routing.',
  },
  {
    slug: 'enescingoz/awesome-n8n-templates',
    label: 'awesome-n8n-templates',
    category: 'n8n Workflow Templates',
    description: 'Production n8n JSON blueprints for webhook queues, RAG, and CRM automation.',
  },
  {
    slug: 'claude-skills-starter-kit',
    label: 'claude-skills-starter-kit',
    category: 'Modular Agent Skills',
    description: 'Reusable skill manifests and JSON schema validators for rapid client delivery.',
  },
];

export default function OpenSourceArbitrageModule({ repos, ownerId }: Props) {
  const [repoInput, setRepoInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('Open Source Arbitrage');
  const [fetchingSlug, setFetchingSlug] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTabByRepo, setActiveTabByRepo] = useState<Record<string, 'json' | 'readme'>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCopy = async (key: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const fetchAndPersistRepo = async (targetSlug: string, category: string) => {
    setFetchingSlug(targetSlug);
    setErrorMsg(null);
    try {
      const response = await fetch('/api/github/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoInput: targetSlug,
          category,
          ownerId,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'GitHub API fetch failed');
      }
      if (data.repo) {
        const r = data.repo as ArbitrageRepo;
        await createDocument<ArbitrageRepo>('arbitrageRepos', r.id, {
          ownerId,
          repoUrl: r.repoUrl,
          repoFullName: r.repoFullName,
          category: r.category,
          readmeContent: r.readmeContent,
          jsonFileName: r.jsonFileName,
          jsonRawContent: r.jsonRawContent,
          starsCount: r.starsCount,
        });
      } else {
        await refreshCollectionFromServer('arbitrageRepos', ownerId);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setFetchingSlug(null);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoInput.trim()) return;
    await fetchAndPersistRepo(repoInput.trim(), categoryInput);
    setRepoInput('');
  };

  const handleDeleteRepo = async (id: string) => {
    await deleteDocument('arbitrageRepos', id, ownerId);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-slate-800">
        <div>
          <p className="text-xs font-mono text-cyan-400 tracking-wide">
            02 · GITHUB API INGESTION & ONE-CLICK CLIENT DEPLOYMENT
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-50 mt-1 tracking-tight">
            The Open Source Arbitrage Library
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Connects to the GitHub REST API to pull raw README.md documentation and deployable .json workflow schemas into Firestore for instant one-click clipboard deployment.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono tabular-nums text-slate-300">
          <span>Indexed Repositories: <strong className="text-slate-100">{repos.length}</strong></span>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <span>Target Presets: <strong className="text-cyan-400">4 Verified</strong></span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-950/50 border border-red-800/80 rounded-lg text-sm text-red-200 flex items-center justify-between">
          <span>GitHub API Error: {errorMsg}</span>
          <button
            onClick={() => setErrorMsg(null)}
            className="px-3 py-1 text-xs bg-red-900/60 rounded text-red-100 whitespace-nowrap shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Priority Target Presets + Custom GitHub URL Ingestion */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left: 4 Required Target Repositories */}
        <div className="xl:col-span-7 bg-slate-900/90 border border-slate-800 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-100">
              Priority Arbitrage Target Repositories
            </h2>
            <span className="text-xs text-slate-400">One-Click GitHub Sync</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TARGET_REPOS.map((t) => {
              const isFetching = fetchingSlug === t.slug;
              return (
                <div
                  key={t.slug}
                  className="p-4 bg-slate-950 border border-slate-800 rounded-md flex flex-col justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono text-cyan-400 font-medium truncate">
                        {t.label}
                      </span>
                      <span className="text-xs text-slate-500 whitespace-nowrap shrink-0">
                        {t.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      {t.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={Boolean(fetchingSlug)}
                    onClick={() => fetchAndPersistRepo(t.slug, t.category)}
                    className="w-full py-1.5 px-3 text-xs font-medium bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-100 rounded transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50"
                  >
                    <DownloadCloud className="w-3.5 h-3.5" />
                    {isFetching ? 'Fetching from GitHub...' : 'Fetch & Store to Vault'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Custom Repository URL Form */}
        <form
          onSubmit={handleFormSubmit}
          className="xl:col-span-5 bg-slate-900/90 border border-slate-800 rounded-lg p-6 flex flex-col justify-between space-y-4"
        >
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Custom GitHub Repository Ingestion
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter any GitHub URL or owner/repo slug to pull its live README.md and raw .json schema into Firestore.
              </p>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                GitHub Repository URL or Slug
              </label>
              <input
                type="text"
                required
                placeholder="https://github.com/n8n-io/n8n or haih-net/agent"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono bg-slate-950 border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Deployment Practice Category
              </label>
              <select
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="Enterprise Context OS">Enterprise Context OS</option>
                <option value="Autonomous Agent Runtime">Autonomous Agent Runtime</option>
                <option value="n8n Workflow Automation">n8n Workflow Automation</option>
                <option value="Modular Agent Skills">Modular Agent Skills</option>
                <option value="Open Source Arbitrage">Open Source Arbitrage</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={Boolean(fetchingSlug)}
            className="w-full py-2.5 px-4 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-md transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <GitBranch className="w-4 h-4" />
            {fetchingSlug ? 'Querying GitHub REST API...' : 'Ingest Repository via GitHub API'}
          </button>
        </form>
      </div>

      {/* Stored Arbitrage Vault List */}
      <div className="space-y-4">
        {repos.map((repo) => {
          const activeTab = activeTabByRepo[repo.id] || 'json';
          return (
            <div
              key={repo.id}
              className="bg-slate-900/90 border border-slate-800 rounded-lg p-6 space-y-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono tabular-nums text-slate-400">
                    <span className="text-cyan-400 font-semibold">{repo.repoFullName}</span>
                    <span aria-hidden="true">·</span>
                    <span>{repo.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>Stars: {repo.starsCount.toLocaleString()}</span>
                    <span aria-hidden="true">·</span>
                    <span>JSON Asset: {repo.jsonFileName}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <h3 className="text-lg font-semibold text-slate-50">{repo.repoFullName}</h3>
                    <a
                      href={repo.repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-slate-400 hover:text-cyan-400 inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      GitHub
                    </a>
                  </div>
                </div>

                {/* Instant 1-Click Clipboard Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopy(`json_${repo.id}`, repo.jsonRawContent)}
                    className="px-4 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-md transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    {copiedId === `json_${repo.id}` ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Copied Raw .JSON
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Raw .JSON
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopy(`readme_${repo.id}`, repo.readmeContent)}
                    className="px-3.5 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-md transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    {copiedId === `readme_${repo.id}` ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Copied README.md
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy README.md
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteRepo(repo.id)}
                    className="p-2 text-slate-400 hover:text-red-400 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors"
                    title="Remove Repository"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Segmented Viewer for Raw JSON vs README.md */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-md w-fit">
                  <button
                    type="button"
                    onClick={() => setActiveTabByRepo({ ...activeTabByRepo, [repo.id]: 'json' })}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                      activeTab === 'json'
                        ? 'bg-slate-800 text-cyan-400'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    {repo.jsonFileName}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTabByRepo({ ...activeTabByRepo, [repo.id]: 'readme' })}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                      activeTab === 'readme'
                        ? 'bg-slate-800 text-cyan-400'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    README.md
                  </button>
                </div>

                <pre className="p-4 bg-slate-950 border border-slate-800 rounded-md text-xs font-mono text-slate-200 max-h-64 overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">
                  {activeTab === 'json' ? repo.jsonRawContent : repo.readmeContent}
                </pre>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
