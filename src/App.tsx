import React, { useEffect, useState } from 'react';
import {
  Radio,
  GitBranch,
  MailCheck,
  Landmark,
  Film,
  BrainCircuit,
  Menu,
  X,
  LogIn,
  LogOut,
  Shield,
} from 'lucide-react';
import {
  ModuleId,
  InterceptorJob,
  ArbitrageRepo,
  ColdLead,
  LedgerEntry,
  VrPipelineItem,
  BciCalibration,
} from './types/apex';
import {
  OperatorSession,
  subscribeAuthChanges,
  signInOperator,
  signOutOperator,
  subscribeCollection,
} from './lib/firebase';
import InterceptorFeedModule from './components/InterceptorFeedModule';
import OpenSourceArbitrageModule from './components/OpenSourceArbitrageModule';
import ColdEmailAirlockModule from './components/ColdEmailAirlockModule';
import AccountablePlanLedgerModule from './components/AccountablePlanLedgerModule';
import CyberneticVrPipelineModule from './components/CyberneticVrPipelineModule';
import BciArCalibrationModule from './components/BciArCalibrationModule';

interface NavModuleConfig {
  id: ModuleId;
  index: string;
  shortLabel: string;
  fullLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

const MODULES: NavModuleConfig[] = [
  {
    id: 'interceptor',
    index: '01',
    shortLabel: 'Interceptor',
    fullLabel: 'Interceptor Feed',
    icon: Radio,
  },
  {
    id: 'arbitrage',
    index: '02',
    shortLabel: 'Arbitrage',
    fullLabel: 'Open Source Arbitrage',
    icon: GitBranch,
  },
  {
    id: 'cold-email',
    index: '03',
    shortLabel: 'Airlock',
    fullLabel: 'Cold Email Infrastructure',
    icon: MailCheck,
  },
  {
    id: 'ledger',
    index: '04',
    shortLabel: 'Ledger',
    fullLabel: 'Accountable Plan Ledger',
    icon: Landmark,
  },
  {
    id: 'vr-pipeline',
    index: '05',
    shortLabel: 'VR Pipeline',
    fullLabel: 'Cybernetic VR Pipeline',
    icon: Film,
  },
  {
    id: 'bci-hub',
    index: '06',
    shortLabel: 'BCI & AR',
    fullLabel: 'BCI & AR Calibration Hub',
    icon: BrainCircuit,
  },
];

export default function App() {
  const [activeModule, setActiveModule] = useState<ModuleId>('interceptor');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [session, setSession] = useState<OperatorSession | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);

  // Real-time synchronized state across all 6 Firestore collections
  const [interceptorJobs, setInterceptorJobs] = useState<InterceptorJob[]>([]);
  const [arbitrageRepos, setArbitrageRepos] = useState<ArbitrageRepo[]>([]);
  const [coldLeads, setColdLeads] = useState<ColdLead[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [vrPipelineItems, setVrPipelineItems] = useState<VrPipelineItem[]>([]);
  const [bciCalibrations, setBciCalibrations] = useState<BciCalibration[]>([]);

  useEffect(() => {
    const unsubAuth = subscribeAuthChanges((opSession) => {
      setSession(opSession);
    });
    return () => unsubAuth();
  }, []);

  const ownerId = session?.uid || 'op_frankie_heine_apex01';

  useEffect(() => {
    if (!session) return;

    const unsub1 = subscribeCollection<InterceptorJob>(
      'interceptorJobs',
      ownerId,
      setInterceptorJobs
    );
    const unsub2 = subscribeCollection<ArbitrageRepo>(
      'arbitrageRepos',
      ownerId,
      setArbitrageRepos
    );
    const unsub3 = subscribeCollection<ColdLead>('coldLeads', ownerId, setColdLeads);
    const unsub4 = subscribeCollection<LedgerEntry>(
      'ledgerEntries',
      ownerId,
      setLedgerEntries
    );
    const unsub5 = subscribeCollection<VrPipelineItem>(
      'vrPipelineItems',
      ownerId,
      setVrPipelineItems
    );
    const unsub6 = subscribeCollection<BciCalibration>(
      'bciCalibrations',
      ownerId,
      setBciCalibrations
    );

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
      unsub6();
    };
  }, [session, ownerId]);

  const handleAuthAction = async () => {
    if (session) {
      await signOutOperator();
      setSession(null);
    } else {
      const signedIn = await signInOperator();
      setSession(signedIn);
    }
  };

  const getModuleCount = (id: ModuleId): number => {
    switch (id) {
      case 'interceptor':
        return interceptorJobs.length;
      case 'arbitrage':
        return arbitrageRepos.length;
      case 'cold-email':
        return coldLeads.length;
      case 'ledger':
        return ledgerEntries.length;
      case 'vr-pipeline':
        return vrPipelineItems.length;
      case 'bci-hub':
        return bciCalibrations.length;
    }
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-50 flex flex-col">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-3.5 bg-[#090D16]/95 backdrop-blur border-b border-slate-800">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveModule('interceptor');
          }}
          className="text-lg font-bold tracking-tight text-slate-50 whitespace-nowrap shrink-0 font-display"
        >
          The Apex Management Interface
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-400">
          {MODULES.slice(0, 5).map((m) => (
            <a
              key={m.id}
              href={`#${m.id}`}
              onClick={(e) => {
                e.preventDefault();
                setActiveModule(m.id);
              }}
              className={`hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 ${
                activeModule === m.id ? 'text-cyan-400 underline underline-offset-8' : ''
              }`}
            >
              {m.shortLabel}
            </a>
          ))}
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleAuthAction}
            className="px-4 py-2 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-md transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            {session ? (
              <>
                <LogOut className="w-3.5 h-3.5" />
                Sign Out Operator
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5" />
                Authenticate Operator
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-300 hover:text-slate-100 bg-slate-900 border border-slate-800 rounded-md"
            aria-label="Toggle Navigation Drawer"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Workspace Layout: Persistent Left Navigation Sidebar + Module Viewport */}
      <div className="flex-1 flex relative">
        {/* Persistent Left-Hand Navigation Sidebar */}
        <aside
          className={`${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } fixed lg:static inset-y-0 left-0 z-20 w-[268px] shrink-0 bg-[#0B111E] border-r border-slate-800 flex flex-col justify-between transition-transform duration-150 ease-out pt-4 lg:pt-6 pb-6 px-4`}
        >
          <div className="space-y-6">
            <div className="px-2">
              <p className="text-xs font-mono text-slate-400">
                COMMAND ROUTING MODULES
              </p>
            </div>

            <nav className="space-y-1.5">
              {MODULES.map((mod) => {
                const Icon = mod.icon;
                const isActive = activeModule === mod.id;
                const count = getModuleCount(mod.id);
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => {
                      setActiveModule(mod.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 border border-transparent'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2.5 truncate">
                      <span className="font-mono text-[11px] text-slate-500">{mod.index}.</span>
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                      <span className="truncate">{mod.fullLabel}</span>
                    </span>
                    <span className="font-mono tabular-nums text-[11px] text-slate-400">
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Operator Profile & Hardware Stack Summary */}
          <div className="pt-6 border-t border-slate-800/90 space-y-4 px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md overflow-hidden border border-slate-700 bg-slate-900 shrink-0 flex items-center justify-center">
                {!avatarFailed ? (
                  <img
                    src="/src/assets/images/avatar_apex_operator_1793484667718.jpg"
                    alt="Apex Principal Operator"
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Shield className="w-5 h-5 text-cyan-400" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-100 truncate">
                  {session ? session.displayName : 'Unauthenticated'}
                </div>
                <div className="text-[11px] font-mono text-slate-400 truncate">
                  {session ? session.email : 'Sign in required'}
                </div>
              </div>
            </div>

            <div className="text-[11px] font-mono text-slate-400 space-y-1 leading-relaxed">
              <div>Compute: Lenovo LOQ RTX 4060</div>
              <div>Storage: Synology 4-Bay RAID 5</div>
              <div>Optics: Insta360 X5 · INMO Air 3</div>
            </div>
          </div>
        </aside>

        {/* Main Operational Viewport */}
        <main className="flex-1 min-w-0 p-6 lg:p-8 max-w-[1440px] mx-auto w-full">
          {!session ? (
            <div className="max-w-lg mx-auto my-16 p-8 bg-slate-900 border border-slate-800 rounded-lg text-center space-y-5">
              <Shield className="w-10 h-10 text-cyan-400 mx-auto" />
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-slate-50">
                  Operator Authentication Required
                </h2>
                <p className="text-sm text-slate-400">
                  Authenticate your operator session to access real-time Firestore collections, Gemini ROI proposal synthesis, and n8n webhook routing.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAuthAction}
                className="w-full py-2.5 px-4 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-md transition-colors inline-flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Authenticate with Google / Operator Session
              </button>
            </div>
          ) : (
            <>
              {activeModule === 'interceptor' && (
                <InterceptorFeedModule jobs={interceptorJobs} ownerId={ownerId} />
              )}
              {activeModule === 'arbitrage' && (
                <OpenSourceArbitrageModule repos={arbitrageRepos} ownerId={ownerId} />
              )}
              {activeModule === 'cold-email' && (
                <ColdEmailAirlockModule leads={coldLeads} ownerId={ownerId} />
              )}
              {activeModule === 'ledger' && (
                <AccountablePlanLedgerModule entries={ledgerEntries} ownerId={ownerId} />
              )}
              {activeModule === 'vr-pipeline' && (
                <CyberneticVrPipelineModule items={vrPipelineItems} ownerId={ownerId} />
              )}
              {activeModule === 'bci-hub' && (
                <BciArCalibrationModule calibrations={bciCalibrations} ownerId={ownerId} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
