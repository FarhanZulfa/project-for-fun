"use client";

import { useState, useEffect } from "react";
import { Room, RoomInsert, RoomType, RoomStatus } from "@/types/database";
import { formatRupiah } from "@/lib/utils";
import { Modal } from "@/components/shared/modal";
import { AcIcon, FanIcon } from "@/components/shared/icons";

interface KamarFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomToEdit?: Room | null;
  onSave: (roomData: RoomInsert, roomId?: string) => Promise<boolean>;
}

export function KamarFormModal({
  isOpen,
  onClose,
  roomToEdit,
  onSave,
}: KamarFormModalProps) {
  const [roomNumber, setRoomNumber] = useState("");
  const [roomType, setRoomType] = useState<RoomType>("kipas");
  const [monthlyPrice, setMonthlyPrice] = useState<number>(900000);
  const [status, setStatus] = useState<RoomStatus>("kosong");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!roomToEdit;

  useEffect(() => {
    if (roomToEdit) {
      setRoomNumber(roomToEdit.room_number);
      setRoomType(roomToEdit.room_type);
      setMonthlyPrice(roomToEdit.monthly_price);
      setStatus(roomToEdit.status);
      setNotes(roomToEdit.notes || "");
    } else {
      setRoomNumber("");
      setRoomType("kipas");
      setMonthlyPrice(900000);
      setStatus("kosong");
      setNotes("");
    }
    setError(null);
  }, [roomToEdit, isOpen]);

  // Saat tipe berganti di mode tambah, set default harga yang lazim jika belum diubah
  function handleTypeChange(type: RoomType) {
    setRoomType(type);
    if (!isEdit) {
      if (type === "ac" && monthlyPrice === 900000) {
        setMonthlyPrice(1500000);
      } else if (type === "kipas" && monthlyPrice === 1500000) {
        setMonthlyPrice(900000);
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanRoomNumber = roomNumber.trim();
    if (!cleanRoomNumber) {
      setError("Nomor kamar wajib diisi.");
      return;
    }

    if (!monthlyPrice || monthlyPrice <= 0) {
      setError("Harga sewa bulanan harus lebih dari 0.");
      return;
    }

    setLoading(true);

    const payload: RoomInsert = {
      room_number: cleanRoomNumber,
      room_type: roomType,
      monthly_price: Number(monthlyPrice),
      status: status,
      notes: notes.trim() || null,
    };

    const success = await onSave(payload, roomToEdit?.id);
    setLoading(false);

    if (success) {
      onClose();
    } else {
      setError("Gagal menyimpan kamar. Pastikan nomor kamar belum digunakan.");
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Kamar ${roomToEdit.room_number}` : "Tambah Kamar Baru"}
      description={
        isEdit
          ? "Perbarui informasi dan harga sewa kamar."
          : "Daftarkan kamar kos baru ke sistem."
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nomor Kamar */}
        <div>
          <label
            htmlFor="room_number"
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
          >
            Nomor Kamar <span className="text-destructive">*</span>
          </label>
          <input
            id="room_number"
            type="text"
            required
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            placeholder="Contoh: 101, 204, A1"
            className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-medium focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>

        {/* Tipe Kamar (Pilihan Tab Visual) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            Tipe Kamar <span className="text-destructive">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleTypeChange("ac")}
              className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 px-3 text-sm font-semibold transition-all ${
                roomType === "ac"
                  ? "border-blue-500 bg-blue-50/80 text-blue-800 shadow-xs ring-2 ring-blue-500/20"
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              <AcIcon size={16} />
              <span>Kamar AC</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("kipas")}
              className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 px-3 text-sm font-semibold transition-all ${
                roomType === "kipas"
                  ? "border-amber-500 bg-amber-50/80 text-amber-800 shadow-xs ring-2 ring-amber-500/20"
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              <FanIcon size={16} />
              <span>Kamar Kipas</span>
            </button>
          </div>
        </div>

        {/* Harga Sewa Bulanan */}
        <div>
          <label
            htmlFor="monthly_price"
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
          >
            Harga Sewa Bulanan (Rp) <span className="text-destructive">*</span>
          </label>
          <input
            id="monthly_price"
            type="number"
            min={0}
            step={50000}
            required
            value={monthlyPrice || ""}
            onChange={(e) => setMonthlyPrice(Number(e.target.value))}
            placeholder="Contoh: 1500000"
            className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-medium focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
          {monthlyPrice > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              Terbaca: <span className="font-semibold text-foreground">{formatRupiah(monthlyPrice)}</span> / bulan
            </p>
          )}
        </div>

        {/* Status Awal (hanya jika tambah baru atau ingin langsung ganti) */}
        <div>
          <label
            htmlFor="status"
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
          >
            Status Kamar
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as RoomStatus)}
            className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-medium focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          >
            <option value="kosong">Kosong (Siap Huni)</option>
            <option value="terisi">Terisi (Ada Penghuni)</option>
            <option value="maintenance">Perbaikan (Maintenance)</option>
          </select>
        </div>

        {/* Catatan / Fasilitas */}
        <div>
          <label
            htmlFor="notes"
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
          >
            Catatan Fasilitas / Posisi (Opsional)
          </label>
          <textarea
            id="notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contoh: Lantai 2 depan tangga, spring bed baru, jendela hadap timur"
            className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>

        {error && (
          <div className="rounded-xl bg-status-terisi-bg border border-status-terisi/20 p-3 text-xs font-medium text-status-terisi">
            {error}
          </div>
        )}

        {/* Tombol Simpan & Batal */}
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
            className="btn-brand px-5 py-2.5 text-xs font-semibold shadow-xs disabled:opacity-50"
          >
            {loading ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Kamar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
