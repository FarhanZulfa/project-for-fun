"use client";

import { useState, useEffect } from "react";
import { Payment, PaymentInsert, PaymentType, PaymentStatus, Tenant, Room } from "@/types/database";
import { formatRupiah } from "@/lib/utils";
import { Modal } from "@/components/shared/modal";
import { HomeIcon, ZapIcon, CleanIcon } from "@/components/shared/icons";

interface PembayaranFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentToEdit?: Payment | null;
  tenants: Tenant[];
  rooms: Room[];
  preselectedTenantId?: string | null;
  onSave: (paymentData: PaymentInsert, paymentId?: string) => Promise<boolean>;
}

export function PembayaranFormModal({
  isOpen,
  onClose,
  paymentToEdit,
  tenants,
  rooms,
  preselectedTenantId,
  onSave,
}: PembayaranFormModalProps) {
  const [tenantId, setTenantId] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType>("sewa");
  const [amount, setAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState("");
  const [isPaid, setIsPaid] = useState(true);
  const [paidDate, setPaidDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Transfer Bank");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!paymentToEdit;

  // Lookup Room by Id
  const roomById = new Map<string, Room>();
  rooms.forEach((r) => roomById.set(r.id, r));

  // Lookup Tenant by Id
  const tenantById = new Map<string, Tenant>();
  tenants.forEach((t) => tenantById.set(t.id, t));

  useEffect(() => {
    const todayStr = new Date().toISOString().split("T")[0];

    if (paymentToEdit) {
      setTenantId(paymentToEdit.tenant_id);
      setPaymentType(paymentToEdit.payment_type);
      setAmount(paymentToEdit.amount);
      setDueDate(paymentToEdit.due_date);
      setIsPaid(paymentToEdit.status === "lunas");
      setPaidDate(paymentToEdit.paid_date || todayStr);
      setPaymentMethod(paymentToEdit.payment_method || "Transfer Bank");
      setNotes(paymentToEdit.notes || "");
    } else {
      const selectedTId = preselectedTenantId || (tenants.length > 0 ? tenants[0].id : "");
      setTenantId(selectedTId);
      setPaymentType("sewa");
      setDueDate(todayStr);
      setIsPaid(true);
      setPaidDate(todayStr);
      setPaymentMethod("Transfer Bank");
      setNotes("");

      // Auto-fill harga sewa kamar jika ada penyewa terpilih
      if (selectedTId) {
        const t = tenantById.get(selectedTId);
        if (t?.room_id) {
          const r = roomById.get(t.room_id);
          if (r) setAmount(r.monthly_price);
        }
      } else {
        setAmount(0);
      }
    }
    setError(null);
  }, [paymentToEdit, preselectedTenantId, isOpen]);

  // Saat penyewa berganti, jika tipe 'sewa', auto-set amount sesuai tarif kamar
  function handleTenantChange(newTenantId: string) {
    setTenantId(newTenantId);
    if (paymentType === "sewa") {
      const t = tenantById.get(newTenantId);
      if (t?.room_id) {
        const r = roomById.get(t.room_id);
        if (r) setAmount(r.monthly_price);
      }
    }
  }

  // Saat tipe pembayaran berganti
  function handlePaymentTypeChange(type: PaymentType) {
    setPaymentType(type);
    if (type === "sewa") {
      const t = tenantById.get(tenantId);
      if (t?.room_id) {
        const r = roomById.get(t.room_id);
        if (r) setAmount(r.monthly_price);
      }
    } else if (!isEdit && amount > 500000) {
      // Jika listrik atau air, reset ke nominal lazim
      setAmount(type === "listrik" ? 100000 : 50000);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!tenantId) {
      setError("Pilih penyewa terlebih dahulu.");
      return;
    }

    const tenant = tenantById.get(tenantId);
    if (!tenant?.room_id) {
      setError("Penyewa tidak memiliki kamar terkait.");
      return;
    }

    if (!amount || amount <= 0) {
      setError("Nominal pembayaran harus lebih dari Rp 0.");
      return;
    }

    if (!dueDate) {
      setError("Tanggal jatuh tempo wajib diisi.");
      return;
    }

    // Tentukan status pembayaran
    let status: PaymentStatus = "belum_bayar";
    if (isPaid) {
      status = "lunas";
    } else {
      const today = new Date().toISOString().split("T")[0];
      if (dueDate < today) {
        status = "telat";
      } else {
        status = "belum_bayar";
      }
    }

    setLoading(true);

    const payload: PaymentInsert = {
      tenant_id: tenantId,
      room_id: tenant.room_id,
      payment_type: paymentType,
      amount: Number(amount),
      due_date: dueDate,
      status: status,
      paid_date: isPaid ? paidDate || new Date().toISOString().split("T")[0] : null,
      payment_method: isPaid ? paymentMethod : null,
      notes: notes.trim() || null,
    };

    const success = await onSave(payload, paymentToEdit?.id);
    setLoading(false);

    if (success) {
      onClose();
    } else {
      setError("Gagal menyimpan pembayaran. Silakan coba lagi.");
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Pembayaran" : "Catat Pembayaran / Tagihan"}
      description={
        isEdit
          ? "Perbarui nominal, status, atau tanggal pembayaran."
          : "Catat pembayaran sewa, listrik, atau air dalam 3 langkah cepat."
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. Pilih Penyewa & Kamar */}
        <div>
          <label
            htmlFor="tenant_id"
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
          >
            Penyewa & Kamar <span className="text-destructive">*</span>
          </label>
          <select
            id="tenant_id"
            required
            value={tenantId}
            onChange={(e) => handleTenantChange(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-medium focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          >
            <option value="">-- Pilih Penyewa --</option>
            {tenants.map((t) => {
              const r = t.room_id ? roomById.get(t.room_id) : null;
              return (
                <option key={t.id} value={t.id}>
                  {t.full_name} {r ? `(Kamar ${r.room_number})` : ""}
                </option>
              );
            })}
          </select>
        </div>

        {/* 2. Jenis Pembayaran */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            Jenis Tagihan <span className="text-destructive">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: "sewa", label: "Sewa", icon: HomeIcon, desc: "Uang kos" },
                { id: "listrik", label: "Listrik", icon: ZapIcon, desc: "Token/tagihan" },
                { id: "air", label: "Air", icon: CleanIcon, desc: "Iuran air" },
              ] as const
            ).map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handlePaymentTypeChange(item.id)}
                  className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                    paymentType === item.id
                      ? "border-brand bg-brand-muted text-brand ring-2 ring-brand/20"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <IconComponent size={16} className="mb-1" />
                  <span>{item.label}</span>
                  <span className="text-[10px] font-normal opacity-80">{item.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Nominal Pembayaran (Rp) */}
        <div>
          <label
            htmlFor="amount"
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
          >
            Nominal Tagihan (Rp) <span className="text-destructive">*</span>
          </label>
          <input
            id="amount"
            type="number"
            min={0}
            step={10000}
            required
            value={amount || ""}
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder="Contoh: 1500000"
            className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-medium focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
          {amount > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              Terbaca: <span className="font-semibold text-foreground">{formatRupiah(amount)}</span>
            </p>
          )}
        </div>

        {/* 4. Tanggal Jatuh Tempo */}
        <div>
          <label
            htmlFor="due_date"
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
          >
            Tanggal Jatuh Tempo <span className="text-destructive">*</span>
          </label>
          <input
            id="due_date"
            type="date"
            required
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-medium focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>

        {/* 5. Status: Sudah Lunas atau Belum Bayar */}
        <div className="rounded-xl border border-border bg-muted/40 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-foreground">
                Tandai Sudah Lunas
              </span>
              <p className="text-xs text-muted-foreground">
                {isPaid
                  ? "Pembayaran sudah diterima pengelola kos"
                  : "Buat sebagai tagihan terbuka (belum bayar)"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsPaid(!isPaid)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isPaid ? "bg-status-kosong" : "bg-muted"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  isPaid ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Jika Lunas, minta Tanggal Bayar & Metode */}
          {isPaid && (
            <div className="pt-2 border-t border-border space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="paid_date"
                    className="block text-[11px] font-semibold uppercase text-muted-foreground mb-1"
                  >
                    Tanggal Diterima
                  </label>
                  <input
                    id="paid_date"
                    type="date"
                    value={paidDate}
                    onChange={(e) => setPaidDate(e.target.value)}
                    className="w-full rounded-lg border border-border bg-card px-2.5 py-2 text-xs focus:border-brand focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="payment_method"
                    className="block text-[11px] font-semibold uppercase text-muted-foreground mb-1"
                  >
                    Metode Bayar
                  </label>
                  <select
                    id="payment_method"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full rounded-lg border border-border bg-card px-2.5 py-2 text-xs focus:border-brand focus:outline-none"
                  >
                    <option value="Transfer Bank">Transfer Bank</option>
                    <option value="Tunai / Cash">Tunai / Cash</option>
                    <option value="QRIS / E-Wallet">QRIS / E-Wallet</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 6. Catatan Tambahan */}
        <div>
          <label
            htmlFor="notes"
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
          >
            Catatan (Opsional)
          </label>
          <input
            id="notes"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contoh: Transfer ke rekening BCA, lunas bersamaan listrik"
            className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
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
            disabled={loading}
            className="btn-brand px-5 py-2.5 text-xs font-semibold shadow-xs disabled:opacity-50"
          >
            {loading ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Simpan Pembayaran"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
