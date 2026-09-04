"use client";

import { Modal } from "@/components/shared/modal";
import { Payment, Expense, ExpenseCategory, Room, Tenant } from "@/types/database";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import { HomeIcon, PrinterIcon } from "@/components/shared/icons";

interface LaporanPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  periode: string;
  summary: {
    totalRevenue: number;
    totalExpense: number;
    netProfit: number;
    profitMargin: number;
    revenueCount: number;
    expenseCount: number;
    categoryTotals: Record<ExpenseCategory, number>;
  };
  monthlyPayments: Payment[];
  monthlyExpenses: Expense[];
  tenantById: Map<string, Tenant>;
  roomById: Map<string, Room>;
}

export function LaporanPrintModal({
  isOpen,
  onClose,
  periode,
  summary,
  monthlyPayments,
  monthlyExpenses,
  tenantById,
  roomById,
}: LaporanPrintModalProps) {
  function handlePrint() {
    window.print();
  }

  // Hitung subtotal pembayaran per tipe
  const sewaRevenue = monthlyPayments
    .filter((p) => p.payment_type === "sewa")
    .reduce((a, c) => a + Number(c.amount), 0);
  const listrikRevenue = monthlyPayments
    .filter((p) => p.payment_type === "listrik")
    .reduce((a, c) => a + Number(c.amount), 0);
  const airRevenue = monthlyPayments
    .filter((p) => p.payment_type === "air")
    .reduce((a, c) => a + Number(c.amount), 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Lembar Cetak Laporan Keuangan"
      description="Format dokumen siap cetak atau simpan sebagai PDF (A4)."
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Printable Document Sheet */}
        <div
          id="laporan-print-sheet"
          className="rounded-2xl border-2 border-border bg-card p-6 sm:p-8 space-y-6 text-foreground print:p-0 print:border-none"
        >
          {/* Header Kop Laporan */}
          <div className="border-b-2 border-foreground pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-white font-bold text-sm">
                  <HomeIcon size={16} />
                </span>
                <h2 className="font-heading text-xl font-bold tracking-tight">
                  KOSKU — PEMBUKUAN KELUARGA
                </h2>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Laporan Pendapatan, Beban Operasional, dan Laba-Rugi Kasar
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-block rounded-md bg-muted px-2.5 py-1 text-xs font-bold uppercase tracking-wider">
                PERIODE: {periode.toUpperCase()}
              </span>
              <p className="text-[11px] text-muted-foreground mt-1">
                Dicetak: {new Date().toLocaleDateString("id-ID", { dateStyle: "long" })}
              </p>
            </div>
          </div>

          {/* Kartu Ringkasan Keuangan 4 Kotak */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="rounded-xl border border-border p-3 bg-muted/40">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                Pemasukan Lunas
              </span>
              <p className="font-heading text-base font-bold text-foreground mt-1">
                {formatRupiah(summary.totalRevenue)}
              </p>
              <span className="text-[10px] text-muted-foreground">
                {summary.revenueCount} Transaksi
              </span>
            </div>

            <div className="rounded-xl border border-border p-3 bg-muted/40">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                Beban Operasional
              </span>
              <p className="font-heading text-base font-bold text-foreground mt-1">
                {formatRupiah(summary.totalExpense)}
              </p>
              <span className="text-[10px] text-muted-foreground">
                {summary.expenseCount} Catatan
              </span>
            </div>

            <div className="rounded-xl border border-border p-3 bg-muted/40">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                Keuntungan Bersih
              </span>
              <p
                className={`font-heading text-base font-bold mt-1 ${
                  summary.netProfit >= 0 ? "text-status-kosong" : "text-status-terisi"
                }`}
              >
                {formatRupiah(summary.netProfit)}
              </p>
              <span className="text-[10px] font-bold">
                {summary.netProfit >= 0 ? "SURPLUS" : "DEFISIT"}
              </span>
            </div>

            <div className="rounded-xl border border-border p-3 bg-muted/40">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                Margin Keuntungan
              </span>
              <p className="font-heading text-base font-bold text-foreground mt-1">
                {summary.profitMargin.toFixed(1)}%
              </p>
              <span className="text-[10px] text-muted-foreground">dari Total Omzet</span>
            </div>
          </div>

          {/* Tabel 1: Rincian Penerimaan */}
          <div className="space-y-2 text-xs">
            <h3 className="font-heading text-sm font-bold text-foreground border-b border-border pb-1">
              1. Rincian Pemasukan per Kategori
            </h3>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-1.5 font-semibold">Sumber Penerimaan</th>
                  <th className="py-1.5 font-semibold text-right">Subtotal Nominal</th>
                  <th className="py-1.5 font-semibold text-right">Porsi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                <tr>
                  <td className="py-1.5">Sewa Kamar Bulanan</td>
                  <td className="py-1.5 text-right font-medium">{formatRupiah(sewaRevenue)}</td>
                  <td className="py-1.5 text-right text-muted-foreground">
                    {summary.totalRevenue > 0
                      ? Math.round((sewaRevenue / summary.totalRevenue) * 100)
                      : 0}
                    %
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5">Pembayaran Listrik</td>
                  <td className="py-1.5 text-right font-medium">{formatRupiah(listrikRevenue)}</td>
                  <td className="py-1.5 text-right text-muted-foreground">
                    {summary.totalRevenue > 0
                      ? Math.round((listrikRevenue / summary.totalRevenue) * 100)
                      : 0}
                    %
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5">Pembayaran Air</td>
                  <td className="py-1.5 text-right font-medium">{formatRupiah(airRevenue)}</td>
                  <td className="py-1.5 text-right text-muted-foreground">
                    {summary.totalRevenue > 0
                      ? Math.round((airRevenue / summary.totalRevenue) * 100)
                      : 0}
                    %
                  </td>
                </tr>
                <tr className="font-bold bg-muted/30">
                  <td className="py-2">TOTAL PEMASUKAN</td>
                  <td className="py-2 text-right text-status-kosong">
                    {formatRupiah(summary.totalRevenue)}
                  </td>
                  <td className="py-2 text-right">100%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tabel 2: Rincian Beban Operasional */}
          <div className="space-y-2 text-xs">
            <h3 className="font-heading text-sm font-bold text-foreground border-b border-border pb-1">
              2. Rincian Pengeluaran Operasional
            </h3>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-1.5 font-semibold">Pos Pengeluaran</th>
                  <th className="py-1.5 font-semibold text-right">Subtotal Nominal</th>
                  <th className="py-1.5 font-semibold text-right">Porsi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {[
                  { key: "listrik" as ExpenseCategory, label: "Listrik Induk Bersama" },
                  { key: "air" as ExpenseCategory, label: "Air PDAM & Perawatan Pompa" },
                  { key: "pemeliharaan" as ExpenseCategory, label: "Servis & Pemeliharaan" },
                  { key: "kebersihan" as ExpenseCategory, label: "Kebersihan & Sampah" },
                  { key: "gaji" as ExpenseCategory, label: "Gaji / Upah Penjaga & Tukang" },
                  { key: "lainnya" as ExpenseCategory, label: "Biaya Operasional Lainnya" },
                ].map((item) => {
                  const amt = summary.categoryTotals[item.key] || 0;
                  const pct =
                    summary.totalExpense > 0
                      ? Math.round((amt / summary.totalExpense) * 100)
                      : 0;
                  return (
                    <tr key={item.key}>
                      <td className="py-1.5">{item.label}</td>
                      <td className="py-1.5 text-right font-medium">{formatRupiah(amt)}</td>
                      <td className="py-1.5 text-right text-muted-foreground">{pct}%</td>
                    </tr>
                  );
                })}
                <tr className="font-bold bg-muted/30">
                  <td className="py-2">TOTAL PENGELUARAN</td>
                  <td className="py-2 text-right text-status-terisi">
                    {formatRupiah(summary.totalExpense)}
                  </td>
                  <td className="py-2 text-right">100%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Kolom Tanda Tangan */}
          <div className="pt-8 border-t border-border grid grid-cols-2 text-center text-xs">
            <div>
              <p className="text-muted-foreground">Dibuat Oleh,</p>
              <div className="h-16" />
              <p className="font-bold text-foreground">Pengelola KosKu</p>
              <p className="text-[10px] text-muted-foreground">Admin Operasional</p>
            </div>

            <div>
              <p className="text-muted-foreground">Disetujui Oleh,</p>
              <div className="h-16" />
              <p className="font-bold text-foreground">Perwakilan Keluarga</p>
              <p className="text-[10px] text-muted-foreground">Pemilik Properti</p>
            </div>
          </div>
        </div>

        {/* Tombol Aksi Modal */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="btn-brand flex items-center gap-2 px-4 py-2 text-xs font-semibold shadow-xs"
          >
            <PrinterIcon size={15} />
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
