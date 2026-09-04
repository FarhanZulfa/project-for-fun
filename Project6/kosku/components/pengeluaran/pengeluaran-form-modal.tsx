"use client";

import { useState, useEffect } from "react";
import { Expense, ExpenseInsert, ExpenseCategory, Room } from "@/types/database";
import { formatRupiah } from "@/lib/utils";
import { Modal } from "@/components/shared/modal";
import {
  ZapIcon,
  CleanIcon,
  WrenchIcon,
  UsersIcon,
  FileTextIcon,
} from "@/components/shared/icons";

interface PengeluaranFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseToEdit?: Expense | null;
  rooms: Room[];
  onSave: (expenseData: ExpenseInsert, expenseId?: string) => Promise<boolean>;
}

export function PengeluaranFormModal({
  isOpen,
  onClose,
  expenseToEdit,
  rooms,
  onSave,
}: PengeluaranFormModalProps) {
  const [category, setCategory] = useState<ExpenseCategory>("listrik");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [expenseDate, setExpenseDate] = useState("");
  const [roomId, setRoomId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!expenseToEdit;

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    if (expenseToEdit) {
      setCategory(expenseToEdit.category);
      setDescription(expenseToEdit.description);
      setAmount(expenseToEdit.amount);
      setExpenseDate(expenseToEdit.expense_date);
      setRoomId(expenseToEdit.room_id || "");
    } else {
      setCategory("listrik");
      setDescription("");
      setAmount(0);
      setExpenseDate(today);
      setRoomId("");
    }
    setError(null);
  }, [expenseToEdit, isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanDesc = description.trim();
    if (!cleanDesc) {
      setError("Keterangan pengeluaran wajib diisi.");
      return;
    }

    if (!amount || amount <= 0) {
      setError("Nominal biaya pengeluaran harus lebih dari Rp 0.");
      return;
    }

    if (!expenseDate) {
      setError("Tanggal pengeluaran wajib diisi.");
      return;
    }

    setLoading(true);

    const payload: ExpenseInsert = {
      category,
      description: cleanDesc,
      amount: Number(amount),
      expense_date: expenseDate,
      room_id: roomId || null,
    };

    const success = await onSave(payload, expenseToEdit?.id);
    setLoading(false);

    if (success) {
      onClose();
    } else {
      setError("Gagal menyimpan catatan pengeluaran. Silakan coba lagi.");
    }
  }

  const categoryOptions: {
    id: ExpenseCategory;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }[] = [
    { id: "listrik", label: "Listrik Induk", icon: ZapIcon },
    { id: "air", label: "Air / PDAM", icon: CleanIcon },
    { id: "pemeliharaan", label: "Servis & Perbaikan", icon: WrenchIcon },
    { id: "kebersihan", label: "Kebersihan & Sampah", icon: CleanIcon },
    { id: "gaji", label: "Gaji / Upah", icon: UsersIcon },
    { id: "lainnya", label: "Lainnya", icon: FileTextIcon },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Catatan Pengeluaran" : "Catat Pengeluaran Kos"}
      description="Catat biaya operasional kos untuk kalkulasi laba bersih yang akurat."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Pilihan Kategori */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            Kategori Pengeluaran <span className="text-destructive">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {categoryOptions.map((opt) => {
              const IconComp = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setCategory(opt.id)}
                  className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                    category === opt.id
                      ? "border-brand bg-brand-muted text-brand ring-2 ring-brand/20 shadow-xs"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <IconComp size={15} className="shrink-0" />
                  <span className="truncate">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Keterangan Pengeluaran */}
        <div>
          <label
            htmlFor="expense_description"
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
          >
            Keterangan Pengeluaran <span className="text-destructive">*</span>
          </label>
          <input
            id="expense_description"
            type="text"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Contoh: Beli token listrik induk 500rb, Servis AC kmr 102"
            className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-medium focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>

        {/* Nominal Biaya (Rp) */}
        <div>
          <label
            htmlFor="expense_amount"
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
          >
            Nominal Biaya (Rp) <span className="text-destructive">*</span>
          </label>
          <input
            id="expense_amount"
            type="number"
            min={0}
            step={10000}
            required
            value={amount || ""}
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder="Contoh: 350000"
            className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-medium focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
          {amount > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              Terbaca: <span className="font-semibold text-foreground">{formatRupiah(amount)}</span>
            </p>
          )}
        </div>

        {/* Tanggal Pengeluaran */}
        <div>
          <label
            htmlFor="expense_date"
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
          >
            Tanggal Pengeluaran <span className="text-destructive">*</span>
          </label>
          <input
            id="expense_date"
            type="date"
            required
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-medium focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>

        {/* Alokasi Kamar Spesifik (Opsional) */}
        <div>
          <label
            htmlFor="expense_room_id"
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
          >
            Terkait Kamar Tertentu (Opsional)
          </label>
          <select
            id="expense_room_id"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-medium focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          >
            <option value="">-- Operasional Umum / Seluruh Kos --</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                Kamar {r.room_number} ({r.room_type.toUpperCase()})
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-muted-foreground">
            Pilih kamar jika biaya ini untuk perbaikan kamar tertentu (misal ganti kran atau servis AC).
          </p>
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
            {loading
              ? "Menyimpan..."
              : isEdit
              ? "Simpan Perubahan"
              : "Simpan Pengeluaran"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
