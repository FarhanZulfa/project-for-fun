"use client";

import { useState } from "react";
import { Payment, Tenant, Room } from "@/types/database";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import { Modal } from "@/components/shared/modal";
import { CheckIcon } from "@/components/shared/icons";

interface PembayaranLunasModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
  tenant?: Tenant | null;
  room?: Room | null;
  onConfirmLunas: (
    paymentId: string,
    paidDate: string,
    paymentMethod: string
  ) => Promise<boolean>;
}

export function PembayaranLunasModal({
  isOpen,
  onClose,
  payment,
  tenant,
  room,
  onConfirmLunas,
}: PembayaranLunasModalProps) {
  const [paidDate, setPaidDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [paymentMethod, setPaymentMethod] = useState("Transfer Bank");
  const [loading, setLoading] = useState(false);

  if (!payment) return null;

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const success = await onConfirmLunas(payment!.id, paidDate, paymentMethod);
    setLoading(false);
    if (success) {
      onClose();
    }
  }

  const typeName = {
    sewa: "Sewa Kamar",
    listrik: "Listrik",
    air: "Air",
  }[payment.payment_type];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Konfirmasi Pembayaran Lunas"
      description="Tandai tagihan ini sebagai lunas dan catat tanggal pembayarannya."
      maxWidth="sm"
    >
      <form onSubmit={handleConfirm} className="space-y-4">
        {/* Ringkasan Tagihan */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Penyewa</span>
            <span className="text-xs font-semibold text-foreground">
              {tenant?.full_name || "Penyewa"} {room ? `(Kamar ${room.room_number})` : ""}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Jenis Tagihan</span>
            <span className="text-xs font-semibold text-foreground">
              {typeName}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Jatuh Tempo</span>
            <span className="text-xs text-foreground">
              {formatTanggal(payment.due_date)}
            </span>
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">Jumlah Tagihan</span>
            <span className="font-heading text-lg font-bold text-status-kosong">
              {formatRupiah(payment.amount)}
            </span>
          </div>
        </div>

        {/* Input Tanggal Bayar */}
        <div>
          <label
            htmlFor="quick_paid_date"
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
          >
            Tanggal Diterima
          </label>
          <input
            id="quick_paid_date"
            type="date"
            required
            value={paidDate}
            onChange={(e) => setPaidDate(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>

        {/* Metode Pembayaran */}
        <div>
          <label
            htmlFor="quick_payment_method"
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
          >
            Metode Pembayaran
          </label>
          <select
            id="quick_payment_method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          >
            <option value="Transfer Bank">Transfer Bank</option>
            <option value="Tunai / Cash">Tunai / Cash</option>
            <option value="QRIS / E-Wallet">QRIS / E-Wallet</option>
          </select>
        </div>

        {/* Tombol Aksi */}
        <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-status-kosong px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-status-kosong/90 disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
          >
            <CheckIcon size={14} />
            <span>{loading ? "Menyimpan..." : "Tandai Lunas"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
