"use client";

import { Payment, Tenant, Room } from "@/types/database";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import { terbilang } from "@/lib/export-utils";
import { Modal } from "@/components/shared/modal";
import { HomeIcon, PrinterIcon, WhatsAppIcon } from "@/components/shared/icons";

interface KuitansiModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
  tenant: Tenant | null;
  room: Room | null;
}

export function KuitansiModal({
  isOpen,
  onClose,
  payment,
  tenant,
  room,
}: KuitansiModalProps) {
  if (!payment) return null;

  const paidDateStr = payment.paid_date || payment.due_date;
  const paidDateObj = new Date(paidDateStr);
  const nomorKuitansi = `KOSKU-${paidDateObj.getFullYear()}${String(
    paidDateObj.getMonth() + 1
  ).padStart(2, "0")}-${payment.id.slice(0, 8).toUpperCase()}`;

  const nominalTerbilang = terbilang(payment.amount);

  const jenisPembayaranLabel =
    payment.payment_type === "sewa"
      ? "Sewa Kamar Bulanan"
      : payment.payment_type === "listrik"
      ? "Biaya Pemakaian Listrik"
      : "Biaya Pemakaian Air";

  // Kirim Kuitansi ke WhatsApp
  function handleKirimWA() {
    if (!payment) return;
    if (!tenant?.phone_number) {
      alert("Nomor WhatsApp penyewa tidak tersedia.");
      return;
    }

    const cleanPhone = tenant.phone_number.replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("0")
      ? "62" + cleanPhone.slice(1)
      : cleanPhone;

    const pesan = `*KUITANSI PEMBAYARAN RESMI KOSKU*
No: *${nomorKuitansi}*
──────────────────────────────
Telah diterima dari: *${tenant.full_name}*
Kamar: *Kamar ${room?.room_number || "-"}*
Untuk Pembayaran: *${jenisPembayaranLabel}*
Nominal: *${formatRupiah(payment.amount)}*
Terbilang: _${nominalTerbilang}_
Tanggal Bayar: *${formatTanggal(paidDateStr)}*
Metode: *${payment.payment_method || "Transfer Bank"}*
Status: *LUNAS*
──────────────────────────────
Terima kasih banyak atas kerjasamanya Kak ${tenant.full_name}. Bukti ini merupakan tanda terima pembayaran yang sah dari pengelola KosKu.`;

    window.open(
      `https://wa.me/${formattedPhone}?text=${encodeURIComponent(pesan)}`,
      "_blank"
    );
  }

  // Cetak Dokumen Kuitansi
  function handlePrint() {
    window.print();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Kuitansi Pembayaran Digital"
      description="Tanda terima pembayaran sah untuk penyewa kamar kos."
      maxWidth="md"
    >
      <div className="space-y-5">
        {/* Printable Receipt Card */}
        <div
          id="kuitansi-print-area"
          className="rounded-2xl border-2 border-border bg-card p-6 shadow-xs relative overflow-hidden print:border-black print:p-8"
        >
          {/* Header Kop Kuitansi */}
          <div className="border-b-2 border-border pb-4 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand text-white text-xs">
                  <HomeIcon size={14} />
                </span>
                <span className="font-heading text-lg font-bold tracking-tight text-foreground">
                  KosKu
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Pengelolaan Kos Keluarga Modern & Transparan
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                KUITANSI RESMI
              </span>
              <p className="font-mono text-xs font-bold text-foreground mt-1">
                {nomorKuitansi}
              </p>
            </div>
          </div>

          {/* Isi Rincian Kuitansi */}
          <div className="py-4 space-y-3.5 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-dashed border-border pb-2.5">
              <span className="text-muted-foreground">Telah Diterima Dari:</span>
              <span className="font-semibold text-foreground text-sm">
                {tenant?.full_name || "Penghuni"}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-dashed border-border pb-2.5">
              <span className="text-muted-foreground">Kamar / Hunian:</span>
              <span className="font-semibold text-foreground">
                Kamar {room?.room_number || "-"} ({room?.room_type?.toUpperCase() || "AC"})
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-dashed border-border pb-2.5">
              <span className="text-muted-foreground">Untuk Pembayaran:</span>
              <span className="font-semibold text-foreground">
                {jenisPembayaranLabel}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-dashed border-border pb-2.5">
              <span className="text-muted-foreground">Tanggal Pelunasan:</span>
              <span className="font-semibold text-foreground">
                {formatTanggal(paidDateStr)}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-dashed border-border pb-2.5">
              <span className="text-muted-foreground">Metode Pembayaran:</span>
              <span className="font-semibold text-foreground">
                {payment.payment_method || "Transfer Bank"}
              </span>
            </div>

            {/* Kotak Nominal & Terbilang */}
            <div className="rounded-xl bg-muted/60 p-4 border border-border mt-3">
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Jumlah Dibayar:
                </span>
                <span className="font-heading text-xl sm:text-2xl font-bold text-status-kosong">
                  {formatRupiah(payment.amount)}
                </span>
              </div>
              <p className="mt-2 text-[11px] italic text-muted-foreground border-t border-border pt-1.5">
                Terbilang: &ldquo;{nominalTerbilang}&rdquo;
              </p>
            </div>
          </div>

          {/* Stempel Lunas & Tanda Tangan */}
          <div className="pt-3 border-t border-border flex items-center justify-between">
            {/* Watermark Stempel LUNAS */}
            <div className="border-2 border-status-kosong rounded-lg px-3 py-1 -rotate-6 select-none">
              <span className="block font-heading font-black text-sm tracking-wider text-status-kosong">
                ✓ LUNAS
              </span>
              <span className="block text-[8px] font-bold text-status-kosong text-center">
                TERVERIFIKASI
              </span>
            </div>

            <div className="text-right text-[11px]">
              <span className="text-muted-foreground block">Pengelola Kos,</span>
              <div className="h-8" />
              <span className="font-bold text-foreground block">KosKu Manajemen</span>
            </div>
          </div>
        </div>

        {/* Tombol Aksi Kuitansi */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Tutup
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors touch-manipulation"
          >
            <PrinterIcon size={14} className="text-muted-foreground" />
            <span>Cetak Kuitansi</span>
          </button>

          <button
            type="button"
            onClick={handleKirimWA}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-xs"
          >
            <WhatsAppIcon size={14} />
            <span>Kirim Kuitansi ke WhatsApp</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
