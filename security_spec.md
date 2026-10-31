# Security Specification — The Apex Management Interface

## 1. Data Invariants

1. **Strict Owner Isolation**: Every document across `interceptorJobs`, `arbitrageRepos`, `coldLeads`, `ledgerEntries`, `vrPipelineItems`, and `bciCalibrations` MUST belong to an authenticated user with a verified email (`request.auth.token.email_verified == true`) and `ownerId == request.auth.uid`.
2. **Path Variable Hardening**: Every document ID (`{jobId}`, `{repoId}`, `{leadId}`, `{entryId}`, `{itemId}`, `{calibrationId}`) MUST satisfy `isValidId(id)` (`id is string && id.size() >= 1 && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$')`) on `get`, `create`, `update`, and `delete`.
3. **Immutable Provenance**: `ownerId` and `createdAt` can NEVER be mutated during `update`.
4. **Temporal Integrity**: `createdAt` on `create` and `updatedAt` on `create`/`update` MUST equal `request.time`.
5. **Anti-Update-Gap & Shadow Field Prevention**: Every `create` and `update` MUST pass `isValid[Entity](incoming())`, enforcing exact `hasAll` and `hasOnly` key sets, string `.size()` bounds, enum allowlists, and numeric range checks. Every `update` MUST additionally restrict changed keys via `incoming().diff(existing()).affectedKeys().hasOnly(...)`.
6. **Terminal State Locking**: Once a `LedgerEntry` reaches `payoutStatus == 'Reimbursed via Relay Checking'`, no further updates are permitted (except by a verified admin).
7. **Secure List Queries**: Every `allow list` rule MUST enforce `resource.data.ownerId == request.auth.uid` without `get()` or `exists()` calls inside `list`.

---

## 2. The "Dirty Dozen" Payloads

1. **Payload 1 (Identity Spoofing on Create)**: Creating an `interceptorJobs` document where `ownerId` is `"victim_uid_999"` while authenticated as `"attacker_uid_111"`. -> `PERMISSION_DENIED`
2. **Payload 2 (Unverified Email Write)**: Creating an `arbitrageRepos` document with `email_verified: false`. -> `PERMISSION_DENIED`
3. **Payload 3 (Shadow Field Injection on Create)**: Creating a `coldLeads` document with an extra undeclared property `"isAdmin": true`. -> `PERMISSION_DENIED`
4. **Payload 4 (Shadow Field Injection on Update)**: Updating a `vrPipelineItems` document by adding `"bypassAuth": "yes"`. -> `PERMISSION_DENIED`
5. **Payload 5 (ID Poisoning Attack)**: Creating a document at `/interceptorJobs/invalid$id!with*spaces` or a 500-character ID. -> `PERMISSION_DENIED`
6. **Payload 6 (Denial-of-Wallet Oversized String)**: Updating `interceptorJobs.roiProposal` with a 50,000-character string (exceeding the 12,000-char limit). -> `PERMISSION_DENIED`
7. **Payload 7 (Ownership Hijack on Update)**: Updating `ledgerEntries.ownerId` from `"user_1"` to `"user_2"`. -> `PERMISSION_DENIED`
8. **Payload 8 (Timestamp Forgery)**: Creating a `bciCalibrations` document with a backdated client timestamp `createdAt` != `request.time`. -> `PERMISSION_DENIED`
9. **Payload 9 (Terminal State Reversal)**: Updating a `ledgerEntries` document whose `existing().payoutStatus` is already `'Reimbursed via Relay Checking'`. -> `PERMISSION_DENIED`
10. **Payload 10 (Invalid Enum State Shortcutting)**: Updating `coldLeads.verificationStatus` to `'Catch All'` (which is forbidden from storage; only `'Pending Airlock'` and `'Valid'` are valid stored states). -> `PERMISSION_DENIED`
11. **Payload 11 (Cross-Tenant PII Read/Get)**: Authenticated user `"user_2"` attempting to `get` `/coldLeads/lead_owned_by_user_1`. -> `PERMISSION_DENIED`
12. **Payload 12 (Unfiltered Collection Scrape)**: Authenticated user issuing an unconstrained `list` query across `/ledgerEntries` without filtering `ownerId == request.auth.uid`. -> `PERMISSION_DENIED`
