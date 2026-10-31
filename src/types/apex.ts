export type ModuleId =
  | 'interceptor'
  | 'arbitrage'
  | 'cold-email'
  | 'ledger'
  | 'vr-pipeline'
  | 'bci-hub';

export type InterceptorSource = 'playwright-scraper' | 'n8n-alert' | 'test-dispatcher';
export type InterceptorStatus = 'intercepted' | 'proposal_ready' | 'dispatched';

export interface InterceptorJob {
  id: string;
  ownerId: string;
  source: InterceptorSource;
  title: string;
  clientName: string;
  budget: string;
  jobDescription: string;
  webhookToken: string;
  roiProposal: string;
  status: InterceptorStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ArbitrageRepo {
  id: string;
  ownerId: string;
  repoUrl: string;
  repoFullName: string;
  category: string;
  readmeContent: string;
  jsonFileName: string;
  jsonRawContent: string;
  starsCount: number;
  createdAt: string;
  updatedAt: string;
}

export type VerificationAirlockStatus = 'Pending Airlock' | 'Valid';
export type BurnerDomain = 'ops-apexroute.io' | 'cyber-relay.net' | 'automate-veil.org';

export interface ColdLead {
  id: string;
  ownerId: string;
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  jobTitle: string;
  hiringSignal: string;
  verificationStatus: VerificationAirlockStatus;
  assignedBurnerDomain: BurnerDomain;
  createdAt: string;
  updatedAt: string;
}

export type LedgerEntryType = 'Accountable Plan Reimbursement' | 'Personal Capital Contribution';
export type PayoutStatus =
  | 'Pending Verification'
  | 'Approved for Relay Payout'
  | 'Reimbursed via Relay Checking';

export interface LedgerEntry {
  id: string;
  ownerId: string;
  entryType: LedgerEntryType;
  itemTitle: string;
  vendor: string;
  amountCents: number;
  paymentMethod: string;
  reimbursementAccount: string;
  expenseDate: string;
  receiptFileName: string;
  receiptDataUrl: string;
  receiptSha256: string;
  payoutStatus: PayoutStatus;
  createdAt: string;
  updatedAt: string;
}

export type VrStage =
  | 'Raw 30fps Capture'
  | 'Topaz Cloud Interpolation'
  | 'Spatial Metadata Injection'
  | '3D Gaussian Splatting';

export type RifeStatus = 'Idle' | 'Queued' | 'Running RIFE v4.15' | 'Completed';
export type TargetFps = '60fps' | '90fps' | '120fps';

export interface VrPipelineItem {
  id: string;
  ownerId: string;
  clipTitle: string;
  cameraSource: string;
  nasPath: string;
  resolution: string;
  stage: VrStage;
  kaggleNotebookId: string;
  rifeStatus: RifeStatus;
  targetFps: TargetFps;
  createdAt: string;
  updatedAt: string;
}

export type HardwareTarget =
  | 'INMO Air 3 AR + Hybrid BCI'
  | 'SSVEP Occipital Array'
  | 'Micro-EMG Surface Leads';

export interface BciCalibration {
  id: string;
  ownerId: string;
  profileName: string;
  hardwareTarget: HardwareTarget;
  emgTrigger: string;
  emgThresholdMicrovolts: number;
  ssvepGazeX: number;
  ssvepGazeY: number;
  ssvepFrequencyHz: number;
  webhookUrl: string;
  payloadTemplate: string;
  triggerCount: number;
  lastHttpStatus: number;
  createdAt: string;
  updatedAt: string;
}

export const BLUEPRINT_CONSTRAINTS = {
  ID_PATTERN: /^[a-zA-Z0-9_-]+$/,
  MAX_ID_LENGTH: 128,
  INTERCEPTOR: {
    TITLE_MAX: 240,
    CLIENT_MAX: 160,
    BUDGET_MAX: 80,
    DESC_MAX: 8000,
    PROPOSAL_MAX: 12000,
  },
  ARBITRAGE: {
    REPO_URL_MAX: 300,
    REPO_NAME_MAX: 160,
    README_MAX: 100000,
    JSON_MAX: 100000,
  },
  COLD_LEAD: {
    EMAIL_MAX: 180,
    NAME_MAX: 100,
    COMPANY_MAX: 160,
    TITLE_MAX: 160,
    SIGNAL_MAX: 240,
    BURNER_DOMAINS: ['ops-apexroute.io', 'cyber-relay.net', 'automate-veil.org'] as BurnerDomain[],
  },
  LEDGER: {
    TITLE_MAX: 200,
    VENDOR_MAX: 120,
    RECEIPT_DATA_MAX: 750000,
  },
  VR: {
    TITLE_MAX: 180,
    NAS_PATH_MAX: 260,
    NOTEBOOK_MAX: 160,
    STAGES: [
      'Raw 30fps Capture',
      'Topaz Cloud Interpolation',
      'Spatial Metadata Injection',
      '3D Gaussian Splatting',
    ] as VrStage[],
  },
  BCI: {
    PROFILE_MAX: 140,
    TRIGGER_MAX: 120,
    WEBHOOK_MAX: 400,
    PAYLOAD_MAX: 4000,
  },
};
