"use client";

import { useState, useEffect } from "react";
import { Room, Tenant, TenantInsert } from "@/types/database";
import { formatRupiah } from "@/lib/utils";
import { Modal } from "@/components/shared/modal";

interface PenyewaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantToEdit?: Tenant | null;
  rooms: Room[];
  preselectedRoomId?: string | null;
  onSave: (
    tenantData: TenantInsert,
    tenantId?: string,
    previousRoomId?: string | null
  ) => Promise<boolean>;
}

export function PenyewaFormModal({
  isOpen,
  onClose,
  tenantToEdit,
  rooms,
  preselectedRoomId,
  onSave,
}: PenyewaFormModalProps) {
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [roomId, setRoomId] = useState("");
  const [moveInDate, setMoveInDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!tenantToEdit;

  useEffect(() => {
    if (tenantToEdit) {
      setFullName(tenantToEdit.full_name);
      setPhoneNumber(tenantToEdit.phone_number || "");
      setIdNumber(tenantToEdit.id_number || "");
      setRoomId(tenantToEdit.room_id || "");
      setMoveInDate(tenantToEdit.move_in_date || "");
    } else {
      setFullName("");
      setPhoneNumber("");
      setIdNumber("");
      setRoomId(preselectedRoomId || "");
      // Default tanggal hari ini (YYYY-MM-DD)
      setMoveInDate(new Date().toISOString().split("T")[0]);
    }
    setError(null);
  }, [tenantToEdit, preselectedRoomId, isOpen]);

  // Filter pilihan kamar:
  // Tampilkan kamar kosong + kamar yang saat ini ditempati oleh penyewa ini (jika mode edit)
  const availableRooms = rooms.filter(
    (r) => r.status === "kosong" || (isEdit && r.id === tenantToEdit?.room_id)
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanName = fullName.trim();
    if (!cleanName) {
      setError("Nama lengkap penyewa wajib diisi.");
      return;
    }

    if (!roomId) {
      setError("Harap pilih kamar yang akan ditempati.");
      return;
    }

    if (!moveInDate) {
      setError("Tanggal mulai sewa wajib diisi.");
      return;
    }

    // Format nomor WhatsApp / HP: jika diawali '08', bisa dibiarkan atau dinormalkan
    let cleanPhone = phoneNumber.trim().replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "62" + cleanPhone.slice(1);
    }

    setLoading(true);

    const payload: TenantInsert = {
      full_name: cleanName,
      room_id: roomId,
      phone_number: cleanPhone || null,
      id_number: idNumber.trim() || null,
      move_in_date: moveInDate,
      rent_cycle: "bulanan",
    };

    const success = await onSave(
      payload,
      tenantToEdit?.id,
      tenantToEdit?.room_id
    );
    setLoading(false);

    if (success) {
      onClose();
    } else {
      setError("Gagal menyimpan data penyewa. Silakan periksa kembali.");
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Data Penyewa" : "Tambah Penyewa Baru"}
      description={
        isEdit
          ? "Perbarui kontak, kamar, atau data penyewa."
          : "Daftarkan penghuni baru dan alokasikan kamar."
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nama Lengkap */}
        <div>
          <label
            htmlFor="full_name"
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
          >
            Nama Lengkap <span className="text-destructive">*</span>
          </label>
          <input
            id="full_name"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Contoh: Rian Pratama"
            className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-medium focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>

        {/* Nomor WhatsApp / HP */}
        <div>
          <label
            htmlFor="phone_number"
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
          >
            Nomor WhatsApp / HP
          </label>
          <input
            id="phone_number"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Contoh: 081234567890"
            className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-medium focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Digunakan untuk mengirim pesan pengingat tagihan dan kontak darurat.
          </p>
        </div>

        {/* Pilihan Kamar */}
        <div>
          <label
            htmlFor="room_id"
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
          >
            Pilih Kamar <span className="text-destructive">*</span>
          </label>
          <select
            id="room_id"
            required
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-medium focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          >
            <option value="">-- Pilih Kamar Kosong --</option>
            {availableRooms.map((r) => (
              <option key={r.id} value={r.id}>
                Kamar {r.room_number} • Tipe {r.room_type.toUpperCase()} ({formatRupiah(r.monthly_price)}/bln)
              </option>
            ))}
          </select>
          {availableRooms.length === 0 && (
            <p className="mt-1 text-xs text-destructive font-medium">
              Tidak ada kamar kosong saat ini. Ubah status kamar di menu Kamar terlebih dahulu.
            </p>
          )}
        </div>

        {/* Tanggal Mulai Masuk */}
        <div>
          <label
            htmlFor="move_in_date"
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
          >
            Tanggal Mulai Sewa <span className="text-destructive">*</span>
          </label>
          <input
            id="move_in_date"
            type="date"
            required
            value={moveInDate}
            onChange={(e) => setMoveInDate(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-medium focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>

        {/* Nomor KTP / Identitas (Opsional) */}
        <div>
          <label
            htmlFor="id_number"
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
          >
            Nomor KTP / Identitas (Opsional)
          </label>
          <input
            id="id_number"
            type="text"
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            placeholder="16 digit NIK KTP"
            className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-medium focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>

        {error && (
          <div className="rounded-xl bg-status-terisi-bg border border-status-terisi/20 p-3 text-xs font-medium text-status-terisi">
            {error}
          </div>
        )}

        {/* Tombol Simpan */}
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
            disabled={loading || (!roomId && availableRooms.length === 0)}
            className="btn-brand px-5 py-2.5 text-xs font-semibold shadow-xs disabled:opacity-50"
          >
            {loading
              ? "Menyimpan..."
              : isEdit
              ? "Simpan Perubahan"
              : "Daftarkan Penyewa"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
