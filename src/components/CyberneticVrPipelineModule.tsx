import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Cpu,
  HardDrive,
  Plus,
  RefreshCw,
  Trash2,
  Video,
} from 'lucide-react';
import {
  VrPipelineItem,
  VrStage,
  TargetFps,
  BLUEPRINT_CONSTRAINTS,
} from '../types/apex';
import {
  createDocument,
  updateDocument,
  deleteDocument,
  refreshCollectionFromServer,
} from '../lib/firebase';

interface Props {
  items: VrPipelineItem[];
  ownerId: string;
}

const STAGES = BLUEPRINT_CONSTRAINTS.VR.STAGES;

export default function CyberneticVrPipelineModule({ items, ownerId }: Props) {
  const [clipTitle, setClipTitle] = useState('');
  const [cameraSource, setCameraSource] = useState('Insta360 X5');
  const [nasPath, setNasPath] = useState('/volume1/Synology_RAID5/8K_Raw/SEQ05_Capture.insv');
  const [targetFps, setTargetFps] = useState<TargetFps>('90fps');
  const [kaggleNotebookId, setKaggleNotebookId] = useState(
    'apex-cybernetics/rife-v4-15-8k-vr-interpolator'
  );
  const [customKaggleWebhookUrl, setCustomKaggleWebhookUrl] = useState('');
  const [syncingItemId, setSyncingItemId] = useState<string | null>(null);
  const [lastKaggleSyncLog, setLastKaggleSyncLog] = useState<string | null>(null);

  const handleCreateClip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clipTitle.trim()) return;
    const id = `vr_${Date.now()}`;
    await createDocument<VrPipelineItem>('vrPipelineItems', id, {
      ownerId,
      clipTitle: clipTitle.trim().slice(0, 180),
      cameraSource: cameraSource.trim().slice(0, 100),
      nasPath: nasPath.trim().slice(0, 260),
      resolution: '7680x3840 (8K 10-bit)',
      stage: 'Raw 30fps Capture',
      kaggleNotebookId: kaggleNotebookId.trim().slice(0, 160),
      rifeStatus: 'Queued',
      targetFps,
    });
    setClipTitle('');
  };

  const handleMoveStage = async (item: VrPipelineItem, direction: -1 | 1) => {
    const idx = STAGES.indexOf(item.stage);
    const nextIdx = idx + direction;
    if (nextIdx < 0 || nextIdx >= STAGES.length) return;
    const nextStage: VrStage = STAGES[nextIdx];

    await updateDocument<VrPipelineItem>('vrPipelineItems', item.id, {
      stage: nextStage,
    });
  };

  const handleTriggerKaggleRife = async (item: VrPipelineItem) => {
    setSyncingItemId(item.id);
    try {
      const response = await fetch('/api/n8n/kaggle-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          kaggleNotebookId: item.kaggleNotebookId,
          action: 'advance_rife',
          customWebhookUrl: customKaggleWebhookUrl.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setLastKaggleSyncLog(
          `Synced ${data.kernelSlug} (${data.rifeEngine}) at ${new Date(
            data.syncedAt
          ).toLocaleTimeString()}`
        );
        await refreshCollectionFromServer('vrPipelineItems', ownerId);
      }
    } finally {
      setSyncingItemId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-slate-800">
        <div>
          <p className="text-xs font-mono text-cyan-400 tracking-wide">
            05 · INSTA360 X5 8K CAPTURE · SYNOLOGY RAID 5 NAS · KAGGLE RIFE INTERPOLATION
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-50 mt-1 tracking-tight">
            The Cybernetic VR Pipeline Tracker
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Four-stage Kanban logistics board tracking 8K 360 spatial video sequences from Raw 30fps Capture through 3D Gaussian Splatting, synchronized with Kaggle RIFE compute notebooks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-mono tabular-nums text-slate-300">
          <span>Active 8K Sequences: <strong className="text-slate-100">{items.length}</strong></span>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <span>NAS Array: <strong className="text-emerald-400">Synology 4-Bay RAID 5</strong></span>
        </div>
      </div>

      {/* Sub-Module: Kaggle RIFE Notebook API Status & Clip Ingestion */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Kaggle RIFE Sub-Module */}
        <div className="xl:col-span-6 bg-slate-900/90 border border-slate-800 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <h2 className="text-base font-semibold text-slate-100">
                Kaggle RIFE Interpolation Sub-Module
              </h2>
            </div>
            <span className="text-xs font-mono text-emerald-400">
              RIFE v4.15 Optical Flow
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Monitors open-source RIFE frame interpolation notebooks running on Kaggle 2x Tesla T4 GPU instances (paired with local Lenovo LOQ RTX 4060 / ThinkBook Oculink eGPU pre-processing).
          </p>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              n8n / Kaggle Status Webhook Route (Optional Override)
            </label>
            <input
              type="url"
              placeholder="https://n8n.yourdomain.com/webhook/kaggle-rife-status"
              value={customKaggleWebhookUrl}
              onChange={(e) => setCustomKaggleWebhookUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="space-y-2 pt-1">
            {items.map((item) => (
              <div
                key={`rife_${item.id}`}
                className="p-3 bg-slate-950 border border-slate-800 rounded-md flex flex-wrap items-center justify-between gap-3 text-xs font-mono tabular-nums"
              >
                <div className="min-w-0">
                  <div className="text-slate-200 truncate font-medium">{item.clipTitle}</div>
                  <div className="text-slate-500 truncate">
                    Kernel: {item.kaggleNotebookId} · Target: {item.targetFps}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={
                      item.rifeStatus === 'Completed'
                        ? 'text-emerald-400 font-semibold'
                        : item.rifeStatus === 'Running RIFE v4.15'
                          ? 'text-cyan-400 font-semibold'
                          : 'text-amber-400'
                    }
                  >
                    {item.rifeStatus}
                  </span>
                  <button
                    type="button"
                    disabled={syncingItemId === item.id}
                    onClick={() => handleTriggerKaggleRife(item)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-100 rounded transition-colors inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                  >
                    <RefreshCw className="w-3 h-3" />
                    {syncingItemId === item.id ? 'Polling...' : 'Step RIFE State'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {lastKaggleSyncLog && (
            <div className="text-xs font-mono text-cyan-300 pt-1">
              Last API Sync: {lastKaggleSyncLog}
            </div>
          )}
        </div>

        {/* New 8K 360 Sequence Ingestion Form */}
        <form
          onSubmit={handleCreateClip}
          className="xl:col-span-6 bg-slate-900/90 border border-slate-800 rounded-lg p-6 flex flex-col justify-between space-y-4"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-100">
                Register New 8K 360 Capture Sequence
              </h2>
              <span className="text-xs font-mono text-slate-400">7680x3840 Equirectangular</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Sequence Title</label>
                <input
                  type="text"
                  required
                  placeholder="SEQ-05: Neural Interface Lab Tour"
                  value={clipTitle}
                  onChange={(e) => setClipTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Capture Hardware</label>
                <input
                  type="text"
                  required
                  value={cameraSource}
                  onChange={(e) => setCameraSource(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs text-slate-400 mb-1">
                  Synology RAID 5 NAS Volume Path
                </label>
                <input
                  type="text"
                  required
                  value={nasPath}
                  onChange={(e) => setNasPath(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Target RIFE FPS</label>
                <select
                  value={targetFps}
                  onChange={(e) => setTargetFps(e.target.value as TargetFps)}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="60fps">60fps</option>
                  <option value="90fps">90fps</option>
                  <option value="120fps">120fps</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Kaggle RIFE Kernel Slug</label>
              <input
                type="text"
                required
                value={kaggleNotebookId}
                onChange={(e) => setKaggleNotebookId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-md transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Sequence to Raw 30fps Capture Column
          </button>
        </form>
      </div>

      {/* 4-Column Kanban Logistics Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {STAGES.map((stage, stageIndex) => {
          const columnItems = items.filter((i) => i.stage === stage);
          return (
            <div
              key={stage}
              className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 flex flex-col justify-between min-h-[420px]"
            >
              <div className="space-y-4">
                {/* Column Header */}
                <div className="pb-3 border-b border-slate-800 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-mono text-cyan-400 block">
                      STAGE 0{stageIndex + 1}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-100">{stage}</h3>
                  </div>
                  <span className="text-xs font-mono tabular-nums text-slate-400">
                    {columnItems.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="space-y-3">
                  {columnItems.length === 0 ? (
                    <div className="p-6 border border-dashed border-slate-800 rounded-md text-center text-xs text-slate-500">
                      No 8K clips in {stage}
                    </div>
                  ) : (
                    columnItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 bg-slate-950 border border-slate-800 rounded-md space-y-3 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-400">
                            <Video className="w-3.5 h-3.5 shrink-0" />
                            <span>{item.cameraSource}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteDocument('vrPipelineItems', item.id, ownerId)}
                            className="text-slate-500 hover:text-red-400 transition-colors"
                            title="Delete Sequence"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <h4 className="text-sm font-semibold text-slate-100 leading-snug">
                          {item.clipTitle}
                        </h4>

                        <div className="text-xs font-mono tabular-nums text-slate-400 space-y-1">
                          <div className="flex items-center gap-1.5 truncate" title={item.nasPath}>
                            <HardDrive className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="truncate">{item.nasPath}</span>
                          </div>
                          <div>
                            {item.resolution} · {item.targetFps}
                          </div>
                          <div>
                            RIFE:{' '}
                            <span
                              className={
                                item.rifeStatus === 'Completed'
                                  ? 'text-emerald-400'
                                  : 'text-amber-400'
                              }
                            >
                              {item.rifeStatus}
                            </span>
                          </div>
                        </div>

                        {/* Stage Transition Controls */}
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            disabled={stageIndex === 0}
                            onClick={() => handleMoveStage(item, -1)}
                            className="px-2.5 py-1 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 rounded inline-flex items-center gap-1 disabled:opacity-30 whitespace-nowrap shrink-0"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            Prev
                          </button>

                          <button
                            type="button"
                            disabled={stageIndex === STAGES.length - 1}
                            onClick={() => handleMoveStage(item, 1)}
                            className="px-2.5 py-1 text-xs font-medium bg-cyan-500/20 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 rounded inline-flex items-center gap-1 disabled:opacity-30 whitespace-nowrap shrink-0"
                          >
                            Advance
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
