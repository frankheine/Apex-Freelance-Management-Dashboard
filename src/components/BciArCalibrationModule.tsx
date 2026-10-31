import React, { useState } from 'react';
import {
  Crosshair,
  Zap,
  Plus,
  Trash2,
  Eye,
  Activity,
} from 'lucide-react';
import {
  BciCalibration,
  HardwareTarget,
} from '../types/apex';
import {
  createDocument,
  deleteDocument,
  refreshCollectionFromServer,
} from '../lib/firebase';

interface Props {
  calibrations: BciCalibration[];
  ownerId: string;
}

export default function BciArCalibrationModule({ calibrations, ownerId }: Props) {
  const [profileName, setProfileName] = useState('');
  const [hardwareTarget, setHardwareTarget] = useState<HardwareTarget>(
    'INMO Air 3 AR + Hybrid BCI'
  );
  const [emgTrigger, setEmgTrigger] = useState('Jaw Clench (250ms Isometric)');
  const [emgThresholdMicrovolts, setEmgThresholdMicrovolts] = useState('420');
  const [ssvepGazeX, setSsvepGazeX] = useState('960');
  const [ssvepGazeY, setSsvepGazeY] = useState('540');
  const [ssvepFrequencyHz, setSsvepFrequencyHz] = useState('14.0');
  const [webhookUrl, setWebhookUrl] = useState(
    'http://localhost:3000/api/webhooks/n8n-loopback'
  );
  const [payloadTemplate, setPayloadTemplate] = useState(
    JSON.stringify(
      {
        action: 'execute_handsfree_n8n_pipeline',
        device: 'INMO_Air_3_AR_HUD',
        bciMode: 'SSVEP_PLUS_MICRO_EMG',
      },
      null,
      2
    )
  );
  const [firingId, setFiringId] = useState<string | null>(null);
  const [lastExecutionResult, setLastExecutionResult] = useState<{
    profileName: string;
    httpStatus: number;
    latencyMs: number;
    responseBody: any;
  } | null>(null);
  const [imgFailed, setImgFailed] = useState(false);

  const handleCreateCalibration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim() || !webhookUrl.trim()) return;
    const id = `bci_${Date.now()}`;

    await createDocument<BciCalibration>('bciCalibrations', id, {
      ownerId,
      profileName: profileName.trim().slice(0, 140),
      hardwareTarget,
      emgTrigger: emgTrigger.trim().slice(0, 120),
      emgThresholdMicrovolts: Math.min(5000, Math.max(1, Number(emgThresholdMicrovolts) || 350)),
      ssvepGazeX: Math.min(3840, Math.max(0, Number(ssvepGazeX) || 960)),
      ssvepGazeY: Math.min(2160, Math.max(0, Number(ssvepGazeY) || 540)),
      ssvepFrequencyHz: Math.min(120, Math.max(1, Number(ssvepFrequencyHz) || 12.5)),
      webhookUrl: webhookUrl.trim().slice(0, 400),
      payloadTemplate: payloadTemplate.trim().slice(0, 4000),
      triggerCount: 0,
      lastHttpStatus: 200,
    });

    setProfileName('');
  };

  const handleFireCalibrationTrigger = async (cal: BciCalibration) => {
    setFiringId(cal.id);
    try {
      const response = await fetch('/api/bci/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calibrationId: cal.id,
          webhookUrl: cal.webhookUrl,
          payload: {
            profileName: cal.profileName,
            hardwareTarget: cal.hardwareTarget,
            emgTrigger: cal.emgTrigger,
            emgThresholdMicrovolts: cal.emgThresholdMicrovolts,
            ssvepCoordinates: {
              x: cal.ssvepGazeX,
              y: cal.ssvepGazeY,
              frequencyHz: cal.ssvepFrequencyHz,
            },
            customPayload: cal.payloadTemplate,
            firedAt: new Date().toISOString(),
          },
        }),
      });
      const data = await response.json();
      setLastExecutionResult({
        profileName: cal.profileName,
        httpStatus: data.httpStatus || response.status,
        latencyMs: data.latencyMs || 12,
        responseBody: data.responseBody,
      });
      await refreshCollectionFromServer('bciCalibrations', ownerId);
    } finally {
      setFiringId(null);
    }
  };

  const handleHudClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const normX = Math.round(((e.clientX - rect.left) / rect.width) * 1920);
    const normY = Math.round(((e.clientY - rect.top) / rect.height) * 1080);
    setSsvepGazeX(String(Math.max(0, Math.min(1920, normX))));
    setSsvepGazeY(String(Math.max(0, Math.min(1080, normY))));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-slate-800">
        <div>
          <p className="text-xs font-mono text-cyan-400 tracking-wide">
            06 · INMO AIR 3 AR GLASSES · HYBRID SSVEP + MICRO-EMG NEURAL WEBHOOK ROUTER
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-50 mt-1 tracking-tight">
            The BCI & AR Calibration Hub
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Maps micro-EMG muscular triggers (jaw clench, temporalis pulse) and SSVEP holographic gaze coordinates to live n8n automation webhook endpoints for hands-free execution.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-mono tabular-nums text-slate-300">
          <span>Mapped Neural Profiles: <strong className="text-slate-100">{calibrations.length}</strong></span>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <span>
            Total Hands-Free Executions:{' '}
            <strong className="text-emerald-400">
              {calibrations.reduce((acc, c) => acc + c.triggerCount, 0)}
            </strong>
          </span>
        </div>
      </div>

      {/* Top Split: Interactive INMO Air 3 AR Holographic Gaze Matrix + Calibration Form */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Left: Interactive INMO Air 3 AR Gaze Overlay & Hardware Schematic */}
        <div className="xl:col-span-6 bg-slate-900/90 border border-slate-800 rounded-lg p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" />
                <h2 className="text-base font-semibold text-slate-100">
                  INMO Air 3 AR Holographic Gaze Matrix (1920×1080)
                </h2>
              </div>
              <span className="text-xs font-mono tabular-nums text-cyan-400">
                Click HUD to Set X:{ssvepGazeX} Y:{ssvepGazeY}
              </span>
            </div>

            {/* Interactive AR Reticle Viewport */}
            <div
              onClick={handleHudClick}
              className="relative w-full h-64 bg-slate-950 border border-cyan-500/40 rounded-md overflow-hidden cursor-crosshair select-none"
              style={{
                backgroundImage:
                  'linear-gradient(to right, rgba(6, 182, 212, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(6, 182, 212, 0.08) 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }}
            >
              {/* Selected Gaze Coordinate Crosshair */}
              <div
                style={{
                  left: `${(Number(ssvepGazeX) / 1920) * 100}%`,
                  top: `${(Number(ssvepGazeY) / 1080) * 100}%`,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              >
                <div className="w-7 h-7 rounded-full border border-cyan-400 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                </div>
              </div>

              {/* Existing Calibrated SSVEP Nodes (Click to Fire Live Webhook) */}
              {calibrations.map((cal) => {
                const leftPct = Math.min(94, Math.max(6, (cal.ssvepGazeX / 1920) * 100));
                const topPct = Math.min(90, Math.max(10, (cal.ssvepGazeY / 1080) * 100));
                return (
                  <button
                    key={cal.id}
                    type="button"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      handleFireCalibrationTrigger(cal);
                    }}
                    style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900/95 hover:bg-emerald-500 hover:text-slate-950 border border-emerald-400/70 rounded text-[11px] font-mono tabular-nums text-emerald-300 transition-colors whitespace-nowrap shadow-sm"
                    title="Click SSVEP Target to Fire Live Webhook"
                  >
                    {cal.ssvepFrequencyHz}Hz · {cal.profileName.slice(0, 22)}
                  </button>
                );
              })}

              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-slate-400 pointer-events-none">
                <span>FOV: 1920x1080 Waveguide</span>
                <span>Click any green node to fire its n8n webhook</span>
              </div>
            </div>
          </div>

          {/* Hardware Reference Visual with Resilient Fallback */}
          <div className="relative rounded-md overflow-hidden border border-slate-800 bg-slate-950 h-44">
            {!imgFailed ? (
              <img
                src="/src/assets/images/bci_ar_hud_schematic_1793484667721.jpg"
                alt="INMO Air 3 AR Glasses and micro-EMG neural sensor array schematic"
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className="w-full h-full object-cover opacity-85"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center gap-3 text-xs font-mono text-slate-400">
                <Activity className="w-5 h-5 text-cyan-400" />
                <span>INMO Air 3 Optical Waveguide + 128-Ch Micro-EMG Array</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex items-end p-3">
              <div className="text-xs font-mono text-slate-200">
                Wearable Stack: INMO Air 3 AR + Occipital SSVEP + Surface Micro-EMG
              </div>
            </div>
          </div>
        </div>

        {/* Right: Micro-EMG & SSVEP Calibration Mapping Form */}
        <form
          onSubmit={handleCreateCalibration}
          className="xl:col-span-6 bg-slate-900/90 border border-slate-800 rounded-lg p-6 flex flex-col justify-between space-y-4"
        >
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Map Micro-EMG Trigger & SSVEP Gaze Coordinates to Webhook
              </h2>
              <p className="text-xs text-slate-400">
                Bind a physical micro-EMG gesture and AR gaze coordinate to an external n8n pipeline webhook URL.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  AR Holographic Action Label
                </label>
                <input
                  type="text"
                  required
                  placeholder="Trigger Production Scraper Cluster"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Wearable Subsystem</label>
                <select
                  value={hardwareTarget}
                  onChange={(e) => setHardwareTarget(e.target.value as HardwareTarget)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="INMO Air 3 AR + Hybrid BCI">INMO Air 3 AR + Hybrid BCI</option>
                  <option value="SSVEP Occipital Array">SSVEP Occipital Array</option>
                  <option value="Micro-EMG Surface Leads">Micro-EMG Surface Leads</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Micro-EMG Gesture Trigger
                </label>
                <input
                  type="text"
                  required
                  placeholder="Jaw Clench (250ms)"
                  value={emgTrigger}
                  onChange={(e) => setEmgTrigger(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  EMG Activation Threshold (μV)
                </label>
                <input
                  type="number"
                  required
                  value={emgThresholdMicrovolts}
                  onChange={(e) => setEmgThresholdMicrovolts(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-slate-950 border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">SSVEP Gaze X (px)</label>
                <input
                  type="number"
                  required
                  value={ssvepGazeX}
                  onChange={(e) => setSsvepGazeX(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-slate-950 border border-slate-800 rounded-md text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">SSVEP Gaze Y (px)</label>
                <input
                  type="number"
                  required
                  value={ssvepGazeY}
                  onChange={(e) => setSsvepGazeY(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-slate-950 border border-slate-800 rounded-md text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Flicker Freq (Hz)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={ssvepFrequencyHz}
                  onChange={(e) => setSsvepFrequencyHz(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-slate-950 border border-slate-800 rounded-md text-emerald-400 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Target n8n Pipeline Webhook URL
              </label>
              <input
                type="url"
                required
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">JSON Webhook Payload</label>
              <textarea
                rows={2}
                required
                value={payloadTemplate}
                onChange={(e) => setPayloadTemplate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-md text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-md transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            Save BCI & AR Webhook Calibration
          </button>
        </form>
      </div>

      {/* Live Execution Telemetry Toast */}
      {lastExecutionResult && (
        <div className="p-4 bg-slate-900 border border-emerald-500/50 rounded-lg space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono tabular-nums">
            <span className="text-emerald-400 font-semibold">
              HANDS-FREE WEBHOOK DISPATCHED · {lastExecutionResult.profileName} · HTTP{' '}
              {lastExecutionResult.httpStatus} · {lastExecutionResult.latencyMs}ms
            </span>
            <button
              type="button"
              onClick={() => setLastExecutionResult(null)}
              className="text-slate-400 hover:text-slate-200"
            >
              Clear Output
            </button>
          </div>
          <pre className="p-3 bg-slate-950 border border-slate-800 rounded text-xs font-mono text-slate-300 overflow-x-auto">
            {JSON.stringify(lastExecutionResult.responseBody, null, 2)}
          </pre>
        </div>
      )}

      {/* Calibrated Neural Trigger Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-xs font-mono text-slate-400">
                <th className="py-3 px-4">AR Overlay Profile & Hardware</th>
                <th className="py-3 px-4">Micro-EMG Trigger</th>
                <th className="py-3 px-4">SSVEP Gaze & Hz</th>
                <th className="py-3 px-4">Target Webhook Endpoint</th>
                <th className="py-3 px-4 text-right">Executions</th>
                <th className="py-3 px-4 text-right">Hands-Free Test</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-sm">
              {calibrations.map((cal) => (
                <tr key={cal.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-100">{cal.profileName}</div>
                    <div className="text-xs text-slate-400">{cal.hardwareTarget}</div>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-mono tabular-nums">
                    <div className="text-cyan-300">{cal.emgTrigger}</div>
                    <div className="text-slate-400">Threshold: {cal.emgThresholdMicrovolts} μV</div>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-mono tabular-nums">
                    <div className="text-slate-200">
                      X:{cal.ssvepGazeX} · Y:{cal.ssvepGazeY}
                    </div>
                    <div className="text-emerald-400">{cal.ssvepFrequencyHz.toFixed(1)} Hz</div>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-mono text-slate-300 max-w-xs truncate">
                    {cal.webhookUrl}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-xs">
                    <span className="text-slate-100 font-semibold">{cal.triggerCount}</span>
                    <span className="text-slate-500 ml-1.5">(HTTP {cal.lastHttpStatus})</span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        disabled={firingId === cal.id}
                        onClick={() => handleFireCalibrationTrigger(cal)}
                        className="px-3 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        {firingId === cal.id ? 'Firing...' : 'Fire Webhook Trigger'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteDocument('bciCalibrations', cal.id, ownerId)}
                        className="p-1.5 text-slate-400 hover:text-red-400 rounded transition-colors"
                        title="Delete Calibration"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
