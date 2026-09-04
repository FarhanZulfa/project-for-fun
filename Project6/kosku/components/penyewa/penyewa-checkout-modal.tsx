"use client";

import { useState } from "react";
import { Tenant, Room } from "@/types/database";
import { formatTanggal } from "@/lib/utils";
import { Modal } from "@/components/shared/modal";

interface PenyewaCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant | null;
  room?: Room | null;
  onConfirmCheckout: (
    tenantId: string,
    roomId: string | null,
    moveOutDate: string
  ) => Promise<boolean>;
}

export function PenyewaCheckoutModal({
  isOpen,
  onClose,
  tenant,
  room,
  onConfirmCheckout,
}: PenyewaCheckoutModalProps) {
  const [moveOutDate, setMoveOutDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!tenant) return null;

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!moveOutDate) {
      setError("Tanggal keluar wajib diisi.");
      return;
    }

    setLoading(true);
    setError(null);

    const success = await onConfirmCheckout(
      tenant!.id,
      tenant!.room_id,
      moveOutDate
    );
    setLoading(false);

    if (success) {
      onClose();
    } else {
      setError("Gagal memproses checkout penyewa. Silakan coba lagi.");
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Selesaikan Sewa (Checkout)"
      description="Penyewa akan dipindahkan ke riwayat dan kamar otomatis dikosongkan."
      maxWidth="md"
    >
      <form onSubmit={handleCheckout} className="space-y-4">
        {/* Ringkasan Penyewa & Kamar */}
        <div className="rounded-xl bg-card border border-border p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Nama Penyewa</span>
            <span className="font-semibold text-sm text-foreground">
              {tenant.full_name}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Kamar</span>
            <span className="font-semibold text-sm text-foreground">
              Kamar {room ? room.room_number : "Tidak terkait"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Mulai Masuk</span>
            <span className="text-xs text-foreground">
              {formatTanggal(tenant.move_in_date)}
            </span>
          </div>
        </div>

        {/* Tanggal Keluar */}
        <div>
          <label
            htmlFor="move_out_date"
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
          >
            Tanggal Keluar <span className="text-destructive">*</span>
          </label>
          <input
            id="move_out_date"
            type="date"
            required
            value={moveOutDate}
            onChange={(e) => setMoveOutDate(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-medium focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>

        {/* Informasi Otomatisasi */}
        <div className="rounded-xl bg-status-kosong-bg border border-status-kosong/20 p-3 text-xs text-status-kosong">
          <strong>Otomatis:</strong> Status Kamar {room?.room_number || ""} akan otomatis diubah menjadi <strong>Kosong (Siap Huni)</strong>.
        </div>

        {error && (
          <div className="rounded-xl bg-status-terisi-bg border border-status-terisi/20 p-3 text-xs font-medium text-status-terisi">
            {error}
          </div>
        )}

        {/* Tombol Aksi */}
        <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-destructive px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-destructive/90 disabled:opacity-50 transition-colors"
          >
            {loading ? "Memproses..." : "Konfirmasi Checkout"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
