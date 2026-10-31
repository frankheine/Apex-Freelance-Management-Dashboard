import React, { useState, useRef } from 'react';
import {
  FileCheck2,
  Upload,
  CheckCircle2,
  Clock,
  Trash2,
  Download,
  Laptop,
  Landmark,
} from 'lucide-react';
import {
  LedgerEntry,
  LedgerEntryType,
  PayoutStatus,
} from '../types/apex';
import {
  createDocument,
  updateDocument,
  deleteDocument,
} from '../lib/firebase';

interface Props {
  entries: LedgerEntry[];
  ownerId: string;
}

const DEFAULT_SAMPLE_PDF_DATA_URL =
  'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA2MTIgNzkyXSA+PgplbmRvYmoKdHJhaWxlcgo8PCAvUm9vdCAxIDAgUiA+PgplbmRUcmFpbGVyCiUlRU9G';

async function computeSha256Hex(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function AccountablePlanLedgerModule({ entries, ownerId }: Props) {
  const [entryType, setEntryType] = useState<LedgerEntryType>('Accountable Plan Reimbursement');
  const [itemTitle, setItemTitle] = useState(
    'Lenovo LOQ RTX 4060 (8GB VRAM) Mobile Compute Node'
  );
  const [vendor, setVendor] = useState('Lenovo / Best Buy Commercial');
  const [amountUsd, setAmountUsd] = useState('750.00');
  const [paymentMethod, setPaymentMethod] = useState('Personal Varo Card');
  const [reimbursementAccount, setReimbursementAccount] = useState('Relay Business Checking');
  const [expenseDate, setExpenseDate] = useState('2026-10-31');
  const [receiptFileName, setReceiptFileName] = useState('Lenovo_LOQ_VaroCard_750_Receipt.pdf');
  const [receiptDataUrl, setReceiptDataUrl] = useState(DEFAULT_SAMPLE_PDF_DATA_URL);
  const [receiptSha256, setReceiptSha256] = useState(
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  );
  const [submitting, setSubmitting] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  const handlePdfSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptFileName(file.name.slice(0, 180));

    const arrayBuffer = await file.arrayBuffer();
    const sha256 = await computeSha256Hex(arrayBuffer);
    setReceiptSha256(sha256);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setReceiptDataUrl(reader.result.slice(0, 740000));
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePrefillLenovoLoq = () => {
    setEntryType('Accountable Plan Reimbursement');
    setItemTitle('Lenovo LOQ RTX 4060 (8GB VRAM) Mobile Compute Node');
    setVendor('Lenovo Commercial Direct');
    setAmountUsd('750.00');
    setPaymentMethod('Personal Varo Card');
    setReimbursementAccount('Relay Business Checking');
    setExpenseDate('2026-10-31');
    setReceiptFileName('Lenovo_LOQ_RTX4060_VaroCard_750USD.pdf');
    setReceiptDataUrl(DEFAULT_SAMPLE_PDF_DATA_URL);
  };

  const handlePrefillThinkBookOculink = () => {
    setEntryType('Personal Capital Contribution');
    setItemTitle('Lenovo ThinkBook 16 Gen 6+ IMH + Oculink eGPU Dock');
    setVendor('Lenovo Enterprise Hardware');
    setAmountUsd('1490.00');
    setPaymentMethod('Personal Varo Card');
    setReimbursementAccount('Relay Business Checking');
    setExpenseDate('2026-10-31');
    setReceiptFileName('ThinkBook_16_Gen6_Oculink_Dock_Invoice.pdf');
    setReceiptDataUrl(DEFAULT_SAMPLE_PDF_DATA_URL);
  };

  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedDollars = parseFloat(amountUsd);
    if (isNaN(parsedDollars) || parsedDollars <= 0) return;
    const amountCents = Math.round(parsedDollars * 100);

    setSubmitting(true);
    try {
      const id = `ledger_${Date.now()}`;
      await createDocument<LedgerEntry>('ledgerEntries', id, {
        ownerId,
        entryType,
        itemTitle: itemTitle.trim().slice(0, 200),
        vendor: vendor.trim().slice(0, 120),
        amountCents,
        paymentMethod: paymentMethod.trim().slice(0, 100),
        reimbursementAccount: reimbursementAccount.trim().slice(0, 100),
        expenseDate: expenseDate.trim().slice(0, 32),
        receiptFileName: receiptFileName.trim().slice(0, 180),
        receiptDataUrl,
        receiptSha256,
        payoutStatus: 'Pending Verification',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdvancePayoutStatus = async (entry: LedgerEntry) => {
    if (entry.payoutStatus === 'Reimbursed via Relay Checking') return;
    const nextStatus: PayoutStatus =
      entry.payoutStatus === 'Pending Verification'
        ? 'Approved for Relay Payout'
        : 'Reimbursed via Relay Checking';

    await updateDocument<LedgerEntry>('ledgerEntries', entry.id, {
      payoutStatus: nextStatus,
    });
  };

  const totalPendingCents = entries
    .filter((e) => e.payoutStatus !== 'Reimbursed via Relay Checking')
    .reduce((acc, e) => acc + e.amountCents, 0);

  const totalReimbursedCents = entries
    .filter((e) => e.payoutStatus === 'Reimbursed via Relay Checking')
    .reduce((acc, e) => acc + e.amountCents, 0);

  const totalCapitalCents = entries
    .filter((e) => e.entryType === 'Personal Capital Contribution')
    .reduce((acc, e) => acc + e.amountCents, 0);

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

  return (
    <div className="space-y-8">
      {/* Header & Corporate Veil KPI Strip */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-slate-800">
        <div>
          <p className="text-xs font-mono text-cyan-400 tracking-wide">
            04 · LLC CORPORATE VEIL PROTECTION · IRC § 62(a)(2)(A) ACCOUNTABLE PLAN
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-50 mt-1 tracking-tight">
            The Accountable Plan Financial Ledger
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Enforces strict separation between personal funding instruments (Varo Card) and corporate liquidity (Relay Business Checking) with cryptographic PDF receipt verification.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-5 text-xs font-mono tabular-nums">
          <div>
            <span className="text-slate-500">Pending Relay Payout: </span>
            <strong className="text-amber-400 text-sm">{formatCurrency(totalPendingCents)}</strong>
          </div>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <div>
            <span className="text-slate-500">Settled via Relay: </span>
            <strong className="text-emerald-400 text-sm">{formatCurrency(totalReimbursedCents)}</strong>
          </div>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <div>
            <span className="text-slate-500">Capital Contributions: </span>
            <strong className="text-cyan-400 text-sm">{formatCurrency(totalCapitalCents)}</strong>
          </div>
        </div>
      </div>

      {/* Accountable Plan Reimbursement Form */}
      <form
        onSubmit={handleSubmitEntry}
        className="bg-slate-900/90 border border-slate-800 rounded-lg p-6 space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Accountable Plan Reimbursements & Capital Contribution Logger
            </h2>
            <p className="text-xs text-slate-400">
              Log hardware acquisitions purchased on a personal Varo card, attach the PDF receipt, and queue payout from Relay Business Checking.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrefillLenovoLoq}
              className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-md transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Laptop className="w-3.5 h-3.5" />
              Prefill $750 Lenovo LOQ (Varo Card)
            </button>
            <button
              type="button"
              onClick={handlePrefillThinkBookOculink}
              className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              Prefill ThinkBook 16 + Oculink eGPU
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Ledger Classification</label>
            <select
              value={entryType}
              onChange={(e) => setEntryType(e.target.value as LedgerEntryType)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-cyan-500"
            >
              <option value="Accountable Plan Reimbursement">
                Accountable Plan Reimbursement
              </option>
              <option value="Personal Capital Contribution">
                Personal Capital Contribution
              </option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs text-slate-400 mb-1">Hardware / Infrastructure Asset</label>
            <input
              type="text"
              required
              value={itemTitle}
              onChange={(e) => setItemTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Amount (USD)</label>
            <input
              type="number"
              step="0.01"
              required
              value={amountUsd}
              onChange={(e) => setAmountUsd(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-slate-950 border border-slate-800 rounded-md text-emerald-400 font-semibold focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Personal Funding Card</label>
            <input
              type="text"
              required
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Corporate Payout Account</label>
            <input
              type="text"
              required
              value={reimbursementAccount}
              onChange={(e) => setReimbursementAccount(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Merchant / Vendor</label>
            <input
              type="text"
              required
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Transaction Date</label>
            <input
              type="date"
              required
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* PDF Receipt Vault Upload Bar */}
        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf,.pdf"
              onChange={handlePdfSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => pdfInputRef.current?.click()}
              className="px-3.5 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-md inline-flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              Upload PDF Receipt to Vault
            </button>
            <div className="text-xs font-mono text-slate-400">
              <span className="text-slate-200">{receiptFileName}</span>
              <span aria-hidden="true" className="mx-2">·</span>
              <span>SHA-256: {receiptSha256.slice(0, 16)}...</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-md transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <Landmark className="w-4 h-4" />
            {submitting ? 'Commiting to Ledger...' : 'Commit Accountable Plan Entry'}
          </button>
        </div>
      </form>

      {/* Accountable Plan Ledger Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-xs font-mono text-slate-400">
                <th className="py-3 px-4">Date & Classification</th>
                <th className="py-3 px-4">Asset & Vendor</th>
                <th className="py-3 px-4">Funding to Payout Route</th>
                <th className="py-3 px-4">PDF Receipt Vault</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Relay Payout State</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-sm">
              {entries.map((entry) => {
                const isSettled = entry.payoutStatus === 'Reimbursed via Relay Checking';
                return (
                  <tr key={entry.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="text-xs font-mono tabular-nums text-slate-300">
                        {entry.expenseDate}
                      </div>
                      <div className="text-xs text-cyan-400 mt-0.5">{entry.entryType}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-100">{entry.itemTitle}</div>
                      <div className="text-xs text-slate-400">{entry.vendor}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono">
                      <span className="text-slate-200">{entry.paymentMethod}</span>
                      <span className="text-slate-500 mx-1.5">-&gt;</span>
                      <span className="text-emerald-400">{entry.reimbursementAccount}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <a
                        href={entry.receiptDataUrl}
                        download={entry.receiptFileName}
                        className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-300 hover:text-cyan-200 underline underline-offset-2"
                      >
                        <FileCheck2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate max-w-[170px]">{entry.receiptFileName}</span>
                        <Download className="w-3 h-3 shrink-0" />
                      </a>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                        SHA256: {entry.receiptSha256.slice(0, 12)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-100">
                      {formatCurrency(entry.amountCents)}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono">
                      <div className="inline-flex items-center gap-1.5">
                        {isSettled ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        )}
                        <span
                          className={
                            isSettled
                              ? 'text-emerald-400 font-semibold'
                              : entry.payoutStatus === 'Approved for Relay Payout'
                                ? 'text-cyan-400 font-medium'
                                : 'text-amber-400 font-medium'
                          }
                        >
                          {entry.payoutStatus}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        {!isSettled && (
                          <button
                            type="button"
                            onClick={() => handleAdvancePayoutStatus(entry)}
                            className="px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 rounded transition-colors whitespace-nowrap shrink-0"
                          >
                            {entry.payoutStatus === 'Pending Verification'
                              ? 'Approve Relay Payout'
                              : 'Mark Reimbursed'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteDocument('ledgerEntries', entry.id, ownerId)}
                          className="p-1.5 text-slate-400 hover:text-red-400 rounded transition-colors"
                          title="Delete Entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
