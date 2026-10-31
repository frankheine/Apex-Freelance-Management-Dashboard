# The Apex Management Interface

An enterprise routing hub and centralized command center for a freelance automation and cybernetic media enterprise. It unifies real-time webhook job interception, AI-assisted ROI proposal generation, open-source repository arbitrage, cold email airlock scrubbing, LLC accountable plan ledger tracking, 8K 360 VR pipeline logistics, and wearable BCI/AR webhook calibration backed by Firebase Authentication and Firestore.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and aesthetic choices were confirmed during Phase 1 clarification and govern the full-stack build:

- **External Verification & Compute Routing**: MillionVerifier email scrubbing and Kaggle RIFE notebook status/dispatch operations route through configurable n8n webhook endpoints via the server proxy, with deterministic validation and status parsing when custom webhook URLs are invoked.
- **Webhook Receiver & BCI Dispatch Architecture**: Express server endpoints handle live incoming external Python Playwright/Patchright scraper payloads and outgoing BCI/AR webhook dispatches, paired with an integrated payload dispatcher in the UI for immediate end-to-end testing and verification.
- **Visual Polarity & Palette**: Clinical Cyan (`#06B6D4`) and Emerald (`#10B981`) accents anchored on a deep Obsidian Slate (`#090D16` / `#0F172A`) canvas following a strict 60-30-10 color distribution.

---

## 1. Overview & Core Concept

- **What It Does**: Provides a six-module operational workspace where every control executes a real Firestore database mutation, server-side Gemini API generation, GitHub REST API fetch, or live HTTP/n8n webhook dispatch.
- **Target Audience / Persona**: Principal automation architect and cybernetic media operator managing high-ticket freelance automation contracts, LLC corporate veil compliance, 8K spatial video rendering pipelines, and wearable BCI/AR hardware triggers.
- **Key Value**: Eliminates context switching across disparate scrapers, GitHub templates, lead scrubbers, accounting sheets, and hardware configuration scripts by consolidating all workflows into a zero-loss, real-time command interface.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Authentication & Workspace Initialization**: The operator signs in via Google Authentication (`signInWithPopup`). Upon authentication, real-time Firestore `onSnapshot` listeners hydrate all six operational modules.
2. **Task 1 — The Interceptor Feed Module**: Generates a unique, copyable webhook receiver endpoint URL (`/api/webhooks/interceptor/:token`). When an external Python Playwright script (or the built-in payload dispatcher) POSTs high-ticket job payloads (e.g., failing n8n webhooks or enterprise knowledge management requests), the job appears in the feed and persists to Firestore. Clicking **Generate Proposal** sends the job description through the server-side Gemini API (`gemini-3.8-flash`) wrapped in a strict ROI-focused system prompt, storing and displaying a plain-text, copy-ready proposal.
3. **Task 2 — The Open Source Arbitrage Library**: Provides quick-target presets (`business-context-os`, `haih-net/agent`, `awesome-n8n-templates`, `claude-skills-starter-kit`) and a custom GitHub repository URL input. Submitting a repository queries the GitHub API via the backend proxy to extract `README.md` and raw `.json` workflow/configuration files, persisting them to Firestore for one-click clipboard deployment.
4. **Task 3 — The Cold Email Infrastructure Module**: Accepts raw Apollo.io CSV uploads (filtered for manual data entry hiring signals) and parses rows into the Verification Airlock table. Triggering **Run Airlock Scrub** dispatches the batch to the configured n8n / MillionVerifier webhook proxy, automatically purging rows marked as `Catch All` or `Invalid` from Firestore and formatting `Valid` leads into a clean Smartlead-ready CSV export distributed across three secondary burner domains.
5. **Task 4 — The Accountable Plan Financial Ledger**: Protects the LLC corporate veil by tracking personal capital contributions and Accountable Plan reimbursements. Operators can log expenses (including a one-click preset for the $750 Lenovo LOQ RTX 4060 purchase on a personal Varo card), attach a PDF receipt (validated and stored with full metadata and inline preview/download support), and transition reimbursement payout states (`Pending Verification`, `Approved for Relay Payout`, `Reimbursed via Relay Checking`).
6. **Task 5 — The Cybernetic VR Pipeline Tracker**: A four-column Kanban board (`Raw 30fps Capture`, `Topaz Cloud Interpolation`, `Spatial Metadata Injection`, `3D Gaussian Splatting`) for 8K 360 video production from the Insta360 X5 and Synology RAID 5 NAS archival. Includes a Kaggle RIFE Interpolation sub-module that polls or dispatches notebook status checks via custom n8n/Kaggle webhook endpoints and logs GPU execution telemetry in Firestore.
7. **Task 6 — The BCI and AR Calibration Hub**: Configures wearable hardware mappings for INMO Air 3 AR Glasses and the hybrid SSVEP + micro-EMG Brain-Computer Interface. Operators map specific micro-EMG triggers (e.g., `Jaw Clench`, `Double Blink`, `Subvocal Hum`) and SSVEP gaze coordinates (`X, Y, Hz Frequency`) to live n8n webhook URLs, and can fire live webhook test dispatches from an interactive AR gaze grid.

### Visual Identity & Theme

- **Aesthetic Direction**: Clinical, high-contrast dark mode operational console. Prioritizes dense scannability, zero decorative clutter, and unambiguous semantic status signaling.
- **Color Palette & Mood (60-30-10 Rule)**:
  - **60% Dominant Neutral Canvas**: Deep Obsidian Slate (`#090D16`) primary background and Dark Slate (`#0F172A`) workspace viewport.
  - **30% Structural Surfaces**: Subdued panel surfaces (`#111827` / `#1E293B`) bounded by 1px hairline borders (`#1E293B` / `rgba(148, 163, 184, 0.14)`), crisp alabaster primary text (`#F8FAFC`), and muted slate secondary text (`#94A3B8`).
  - **10% Accent Budget**: Clinical Cyan (`#06B6D4`) for primary interactive controls and active navigation states; Emerald (`#10B981`) for verified leads, completed ROI proposals, and Relay payout confirmation; Amber (`#F59E0B`) for pending airlock/reimbursement states; Crimson (`#EF4444`) for purged/invalid leads and webhook errors.
- **Typography & Hierarchy (2+1 Font Rule)**:
  - **Display & Navigation**: `Outfit` (SemiBold 600 / Bold 700, tight tracking) for section headers and module titles.
  - **Body & Controls**: `Plus Jakarta Sans` (Regular 400 / Medium 500) for crisp legibility across forms, proposals, and descriptions.
  - **Data, Metrics & Coordinates**: `JetBrains Mono` with `font-variant-numeric: tabular-nums` strictly enforced on all financial ledger amounts, webhook timestamps, SSVEP frequencies/coordinates, and CSV airlock counters.
- **Component Styling & Layout**:
  - **Workspace Layout**: Persistent left sidebar ($260\text{px}$ desktop width, collapsible drawer on mobile) switching cleanly across the six modules, paired with a strict 3-zone top bar (Breadcrumb/Brand title on left, quick module jump links in center, and authenticated operator action on right).
  - **Single-Elevation Depth**: Flat dark panels with 1px hairline borders. Zero nested card sandwiches, zero thick left accent borders, and zero decorative pill enclosures on static metadata (metadata uses clean inline text with `·` separators).
- **Interactive Feedback & Motion**:
  - Fast $\le 180\text{ms}$ compositor transitions (`opacity`, `transform`) when switching modules, moving Kanban cards across VR stages, or copying JSON/proposals to clipboard.
  - Every data view implements Populated, Empty (with quick-seed / action triggers), Loading skeleton, and Search/Filter states.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Unified Express Server + Firestore Real-Time Sync for Webhooks**
  - *Chosen Approach*: The Express backend exposes live POST routes (`/api/webhooks/interceptor` and `/api/webhooks/dispatch`) while authenticated clients persist and synchronize records in Firestore. Incoming external webhook jobs are held in a server-side ring buffer and automatically ingested and persisted into the authenticated operator's Firestore collection.
  - *Why*: Allows external headless Python Playwright scripts to hit a standard HTTP POST endpoint without requiring complex Firebase Admin credentials, while ensuring all intercepted jobs are permanently stored in the user's zero-loss Firestore database.
  - *Alternatives Considered*: Client-only state (rejected—cannot receive external HTTP POST requests) or unauthenticated open Firestore writes (rejected—violates Zero-Trust Firestore security rules).
- **Decision 2: Server-Side GitHub & n8n Proxy Architecture**
  - *Chosen Approach*: All GitHub API requests, Gemini ROI proposal generations, MillionVerifier/n8n lead scrubbing calls, and BCI webhook dispatches execute through server-side Express routes (`/api/*`).
  - *Why*: Protects `GEMINI_API_KEY` on the server, avoids browser CORS failures when triggering external n8n webhook URLs or fetching raw GitHub files, and guarantees consistent error reporting.
  - *Alternatives Considered*: Direct browser `fetch` calls to external webhooks and GitHub raw URLs (rejected due to CORS blocks on n8n webhooks and rate-limiting opacity).
- **Decision 3: Verifiable PDF Receipt Storage within Firestore Document Bounds**
  - *Chosen Approach*: For Task 4 (Accountable Plan Financial Ledger), uploaded PDF receipts are validated (`application/pdf`), hashed (SHA-256 checksum for audit integrity), and stored as bounded Base64 data URIs alongside structured receipt metadata inside a dedicated Firestore sub-document/collection (`reimbursements`), with instant in-app PDF viewer/download support.
  - *Why*: The `ProvisionFirebase` environment provisions Firestore and Firebase Auth directly; storing bounded, size-checked PDF documents ($\le 700\text{KB}$) or structured receipt records in Firestore ensures 100% self-contained persistence without external bucket CORS failures.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        THE APEX MANAGEMENT INTERFACE                         │
│           Top Bar (3-Zone Contract) + Persistent Module Sidebar              │
└───────┬──────────────────────────────┬───────────────────────────────┬───────┘
        │                              │                               │
        ▼                              ▼                               ▼
┌───────────────────────┐    ┌───────────────────────┐    ┌───────────────────────┐
│  1. Interceptor Feed  │    │ 2. Open Source        │    │ 3. Cold Email         │
│  - Webhook URL & Key  │    │    Arbitrage Library  │    │    Infrastructure     │
│  - Live Job Stream    │    │ - Repo URL Input      │    │ - Apollo CSV Upload   │
│  - Gemini ROI Builder │    │ - Preset Targets      │    │ - Verification Airlock│
│  - Test Dispatcher    │    │ - 1-Click JSON/README │    │ - Burner Domain Export│
└───────────┬───────────┘    └───────────┬───────────┘    └───────────┬───────────┘
            │                            │                            │
        ┌───┴────────────────────────────┼────────────────────────────┴───┐
        │                                │                                │
        ▼                                ▼                                ▼
┌───────────────────────┐    ┌───────────────────────┐    ┌───────────────────────┐
│  4. Accountable Plan  │    │ 5. Cybernetic VR      │    │ 6. BCI & AR           │
│     Financial Ledger  │    │    Pipeline Tracker   │    │    Calibration Hub    │
│  - Capital & Loq $750 │    │ - 4-Stage 8K Kanban   │    │ - Micro-EMG Mappings  │
│  - PDF Receipt Vault  │    │ - Kaggle RIFE Monitor │    │ - SSVEP Gaze Matrix   │
│  - Relay Payout State │    │ - n8n Compute Trigger │    │ - Live Webhook Fire   │
└───────────┬───────────┘    └───────────┬───────────┘    └───────────┬───────────┘
            │                            │                            │
            └────────────────────────────┼────────────────────────────┘
                                         │
                    ┌────────────────────┴────────────────────┐
                    ▼                                         ▼
     ┌──────────────────────────────┐          ┌──────────────────────────────┐
     │  Firebase (Auth & Firestore) │          │    Express Server (/api/*)   │
     │  - Google Auth Sign-In       │          │  - POST /api/webhooks/ingest │
     │  - Zero-Trust Security Rules │          │  - POST /api/gemini/proposal │
     │  - Real-Time onSnapshot Sync │          │  - POST /api/github/fetch    │
     │  - Strict Schema Validation  │          │  - POST /api/n8n/verify-leads│
     └──────────────────────────────┘          │  - POST /api/n8n/kaggle-sync │
                                               │  - POST /api/bci/trigger     │
                                               └──────────────────────────────┘
```

### Data Model & State (Firestore Collections)

All collections enforce strict owner isolation (`ownerId == request.auth.uid`), verified email checks, immutable `createdAt` server timestamps, and bounded string/list lengths:

1. **`interceptorJobs` (`/interceptorJobs/{jobId}`)**:
   - `ownerId`, `source` (`playwright-scraper` | `n8n-alert` | `test-dispatcher`), `title`, `clientName`, `budget`, `jobDescription`, `webhookToken`, `roiProposal` (plain-text Gemini output), `status` (`intercepted` | `proposal_ready` | `dispatched`), `createdAt`, `updatedAt`.
2. **`arbitrageRepos` (`/arbitrageRepos/{repoId}`)**:
   - `ownerId`, `repoUrl`, `repoFullName`, `readmeContent` (bounded markdown), `jsonFiles` (list of `{ path, content }` objects), `category`, `lastSyncedAt`, `createdAt`, `updatedAt`.
3. **`coldLeads` (`/coldLeads/{leadId}`)**:
   - `ownerId`, `email`, `firstName`, `lastName`, `company`, `jobTitle`, `hiringSignal`, `verificationStatus` (`Pending Airlock` | `Valid`), `assignedBurnerDomain` (`ops-apexroute.io` | `cyber-relay.net` | `automate-veil.org`), `batchId`, `createdAt`, `updatedAt`. *(Note: Rows marked `Catch All` or `Invalid` during scrubbing are automatically deleted from Firestore).*
4. **`ledgerEntries` (`/ledgerEntries/{entryId}`)**:
   - `ownerId`, `entryType` (`Capital Contribution` | `Accountable Plan Reimbursement`), `itemTitle`, `vendor`, `amountCents`, `paymentMethod` (e.g., `Personal Varo Card`), `reimbursementAccount` (e.g., `Relay Business Checking`), `receiptFileName`, `receiptDataUrl`, `receiptSha256`, `payoutStatus` (`Pending Documentation` | `Queued in Relay` | `Settled`), `expenseDate`, `createdAt`, `updatedAt`.
5. **`vrPipelineItems` (`/vrPipelineItems/{itemId}`)**:
   - `ownerId`, `clipTitle`, `cameraSource` (e.g., `Insta360 X5`), `nasPath` (e.g., `/volume1/Synology_RAID5/8K_Raw/`), `resolution` (`7680x3840`), `stage` (`Raw 30fps Capture` | `Topaz Cloud Interpolation` | `Spatial Metadata Injection` | `3D Gaussian Splatting`), `kaggleNotebookId`, `rifeStatus` (`Idle` | `Queued` | `Running RIFE v4.15` | `Completed`), `targetFps` (`60fps` | `90fps` | `120fps`), `createdAt`, `updatedAt`.
6. **`bciCalibrations` (`/bciCalibrations/{calibrationId}`)**:
   - `ownerId`, `profileName`, `hardwareTarget` (`INMO Air 3 AR` | `Hybrid SSVEP + Micro-EMG`), `emgTrigger` (e.g., `Jaw Clench (250ms)`, `Left Temple Pulse`), `emgThresholdMicrovolts`, `ssvepGazeX`, `ssvepGazeY`, `ssvepFrequencyHz`, `webhookUrl`, `payloadTemplate`, `lastTriggeredAt`, `triggerCount`, `createdAt`, `updatedAt`.

### Interactive Component & State Mapping

- **Interceptor Feed**:
  - *Webhook Simulator / Receiver*: Clicking **Dispatch Test Scraper Payload** POSTs a realistic high-ticket job payload to `/api/webhooks/interceptor/:token`. The client syncs the server queue into Firestore `interceptorJobs`.
  - *Generate Proposal*: Clicking **Generate Proposal** invokes `POST /api/gemini/proposal` with the job's description and budget. The server queries `gemini-3.8-flash` using a strict ROI-focused system instruction that forbids markdown fluff and outputs a clinical, plain-text executive proposal, then updates `roiProposal` and `status: 'proposal_ready'` in Firestore.
- **Open Source Arbitrage Library**:
  - *Fetch & Store*: Clicking any target repository preset (`business-context-os`, `haih-net/agent`, `awesome-n8n-templates`, `claude-skills-starter-kit`) or submitting a GitHub URL calls `POST /api/github/fetch`. The server queries the GitHub REST API for the repository's default branch `README.md` and top-level/workflow `.json` files, returning structured content that is saved to Firestore `arbitrageRepos`.
  - *One-Click Copy*: Dedicated **Copy README** and **Copy JSON Payload** buttons write raw content directly to `navigator.clipboard` with instant visual confirmation.
- **Cold Email Infrastructure**:
  - *Apollo CSV Ingestion*: File dropzone and sample Apollo CSV loader parse lead rows and batch-write them to `coldLeads` with status `Pending Airlock`.
  - *Verification Airlock Scrub*: Clicking **Execute Airlock Scrub** sends pending leads to `POST /api/n8n/verify-leads` (supporting custom n8n webhook URLs or built-in MillionVerifier-compatible classification). Any lead classified as `Catch All` or `Invalid` is immediately deleted from Firestore via `deleteDoc`, while `Valid` leads are updated and round-robin assigned across the three burner domains.
  - *Smartlead Export*: Clicking **Export Smartlead CSV** generates and downloads a clean, RFC-4180 compliant CSV containing only verified leads with burner domain routing columns.
- **Accountable Plan Financial Ledger**:
  - *Reimbursement Form & Lenovo LOQ Quick-Fill*: Includes a structured form and a one-click **Prefill $750 Lenovo LOQ (Varo Card)** button. Selecting a PDF file computes its SHA-256 digest and stores the receipt record in Firestore `ledgerEntries`.
  - *Relay Payout Workflow*: Interactive state controls transition entries from `Pending Documentation` to `Queued in Relay` to `Settled`, recalculating total LLC Unreimbursed Liability and Total Capital Contributions in real time.
- **Cybernetic VR Pipeline Tracker**:
  - *Kanban Stage Routing*: Operators create 8K capture cards and advance/regress them across the four required columns (`Raw 30fps Capture`, `Topaz Cloud Interpolation`, `Spatial Metadata Injection`, `3D Gaussian Splatting`), persisting each transition to Firestore `vrPipelineItems`.
  - *Kaggle RIFE Monitor*: Sub-panel configures the Kaggle/n8n webhook endpoint and triggers live status checks or interpolation runs (`POST /api/n8n/kaggle-sync`), updating the active notebook's `rifeStatus` and FPS telemetry in Firestore.
- **BCI & AR Calibration Hub**:
  - *Trigger Mapping & Interactive Gaze HUD*: Form creates and edits EMG + SSVEP coordinate-to-webhook mappings in `bciCalibrations`. Clicking a node on the interactive AR Gaze Overlay or clicking **Fire Webhook Trigger** sends a real HTTP POST request through `POST /api/bci/trigger` to the configured n8n webhook URL, recording the HTTP status code, latency, and incrementing `triggerCount` in Firestore.
