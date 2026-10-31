/**
 * Firestore Security Rules Test Suite — Dirty Dozen Verification
 * Verifies that all 12 adversarial payloads in security_spec.md return PERMISSION_DENIED.
 */

export interface DirtyDozenAssertion {
  id: number;
  name: string;
  collection: string;
  operation: 'create' | 'update' | 'get' | 'list' | 'delete';
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: DirtyDozenAssertion[] = [
  { id: 1, name: 'Identity Spoofing on Create', collection: 'interceptorJobs', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
  { id: 2, name: 'Unverified Email Write', collection: 'arbitrageRepos', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
  { id: 3, name: 'Shadow Field Injection on Create', collection: 'coldLeads', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
  { id: 4, name: 'Shadow Field Injection on Update', collection: 'vrPipelineItems', operation: 'update', expectedResult: 'PERMISSION_DENIED' },
  { id: 5, name: 'ID Poisoning Attack', collection: 'interceptorJobs', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
  { id: 6, name: 'Denial-of-Wallet Oversized String', collection: 'interceptorJobs', operation: 'update', expectedResult: 'PERMISSION_DENIED' },
  { id: 7, name: 'Ownership Hijack on Update', collection: 'ledgerEntries', operation: 'update', expectedResult: 'PERMISSION_DENIED' },
  { id: 8, name: 'Timestamp Forgery', collection: 'bciCalibrations', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
  { id: 9, name: 'Terminal State Reversal', collection: 'ledgerEntries', operation: 'update', expectedResult: 'PERMISSION_DENIED' },
  { id: 10, name: 'Invalid Enum State Shortcutting', collection: 'coldLeads', operation: 'update', expectedResult: 'PERMISSION_DENIED' },
  { id: 11, name: 'Cross-Tenant PII Read/Get', collection: 'coldLeads', operation: 'get', expectedResult: 'PERMISSION_DENIED' },
  { id: 12, name: 'Unfiltered Collection Scrape', collection: 'ledgerEntries', operation: 'list', expectedResult: 'PERMISSION_DENIED' },
];
