"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Payment, PaymentInsert, PaymentType, PaymentStatus, Tenant, Room } from "@/types/database";
import { formatRupiah, formatTanggal, hitungSelisihHari } from "@/lib/utils";
import { PembayaranFormModal } from "@/components/pembayaran/pembayaran-form-modal";
import { PembayaranLunasModal } from "@/components/pembayaran/pembayaran-lunas-modal";
import { KuitansiModal } from "@/components/pembayaran/kuitansi-modal";
import { exportPembayaranCsv } from "@/lib/export-utils";
import { useUser } from "@/lib/context/user-context";
import {
  HomeIcon,
  ZapIcon,
  DropletIcon,
  CoinsIcon,
  AlertCircleIcon,
  CheckIcon,
  ReceiptIcon,
  WhatsAppIcon,
} from "@/components/shared/icons";

function PembayaranContent() {
  const { isAdmin } = useUser();
  const searchParams = useSearchParams();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Filter & Search states
  const [activeTab, setActiveTab] = useState<"semua" | "tagihan" | "lunas">("tagihan");
  const [typeFilter, setTypeFilter] = useState<"semua" | PaymentType>("semua");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [paymentToEdit, setPaymentToEdit] = useState<Payment | null>(null);
  const [preselectedTenantId, setPreselectedTenantId] = useState<string | null>(null);

  const [isLunasOpen, setIsLunasOpen] = useState(false);
  const [paymentToMarkLunas, setPaymentToMarkLunas] = useState<Payment | null>(null);

  const [isKuitansiOpen, setIsKuitansiOpen] = useState(false);
  const [selectedPaymentForKuitansi, setSelectedPaymentForKuitansi] = useState<Payment | null>(null);

  const supabase = createClient();

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 3500);
  }

  // Load Data Payments, Tenants, Rooms
  async function loadData() {
    setLoading(true);
    try {
      // 1. Ambil pembayaran
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("*")
        .order("due_date", { ascending: false });

      if (paymentsError) throw paymentsError;

      // 2. Ambil penyewa aktif
      const { data: tenantsData, error: tenantsError } = await supabase
        .from("tenants")
        .select("*")
        .order("full_name", { ascending: true });

      if (tenantsError) throw tenantsError;

      // 3. Ambil kamar
      const { data: roomsData, error: roomsError } = await supabase
        .from("rooms")
        .select("*");

      if (roomsError) throw roomsError;

      // Update status otomatis untuk tagihan belum bayar yang sudah lewat jatuh tempo
      const todayStr = new Date().toISOString().split("T")[0];
      const normalizedPayments = (paymentsData || []).map((p) => {
        if (p.status === "belum_bayar" && p.due_date < todayStr) {
          return { ...p, status: "telat" as PaymentStatus };
        }
        return p;
      });

      setPayments(normalizedPayments);
      setTenants(tenantsData || []);
      setRooms(roomsData || []);
    } catch (err: any) {
      console.error("Error loading payments:", err);
      showToast("Gagal memuat data pembayaran.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Cek jika diarahkan dari halaman penyewa (?tenant_id=...)
  useEffect(() => {
    const tenantIdParam = searchParams.get("tenant_id");
    if (tenantIdParam) {
      setPreselectedTenantId(tenantIdParam);
      setPaymentToEdit(null);
      setIsFormOpen(true);
    }
  }, [searchParams]);

  // Lookup maps
  const tenantById = useMemo(() => {
    const map = new Map<string, Tenant>();
    tenants.forEach((t) => map.set(t.id, t));
    return map;
  }, [tenants]);

  const roomById = useMemo(() => {
    const map = new Map<string, Room>();
    rooms.forEach((r) => map.set(r.id, r));
    return map;
  }, [rooms]);

  // Ringkasan Keuangan
  const stats = useMemo(() => {
    // Total Lunas
    const totalLunas = payments
      .filter((p) => p.status === "lunas")
      .reduce((acc, curr) => acc + Number(curr.amount), 0);

    // Belum Bayar
    const totalBelumBayar = payments
      .filter((p) => p.status === "belum_bayar")
      .reduce((acc, curr) => acc + Number(curr.amount), 0);

    // Telat / Tunggakan
    const totalTunggakan = payments
      .filter((p) => p.status === "telat")
      .reduce((acc, curr) => acc + Number(curr.amount), 0);

    const jumlahPerluDitagih = payments.filter(
      (p) => p.status === "belum_bayar" || p.status === "telat"
    ).length;

    return { totalLunas, totalBelumBayar, totalTunggakan, jumlahPerluDitagih };
  }, [payments]);

  // Filter data payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // Filter Tab
      if (activeTab === "tagihan" && p.status === "lunas") return false;
      if (activeTab === "lunas" && p.status !== "lunas") return false;

      // Filter Jenis
      if (typeFilter !== "semua" && p.payment_type !== typeFilter) return false;

      // Pencarian
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const tenant = tenantById.get(p.tenant_id);
        const room = roomById.get(p.room_id);
        const matchTenant = tenant ? tenant.full_name.toLowerCase().includes(q) : false;
        const matchRoom = room ? room.room_number.toLowerCase().includes(q) : false;
        return matchTenant || matchRoom;
      }

      return true;
    });
  }, [payments, activeTab, typeFilter, searchQuery, tenantById, roomById]);

  // Simpan Pembayaran (Tambah Baru / Edit)
  async function handleSavePayment(
    payload: PaymentInsert,
    paymentId?: string
  ): Promise<boolean> {
    try {
      if (paymentId) {
        const { error } = await supabase
          .from("payments")
          .update(payload)
          .eq("id", paymentId);

        if (error) throw error;
        showToast("Data pembayaran berhasil diperbarui.");
      } else {
        const { error } = await supabase.from("payments").insert([payload]);
        if (error) throw error;
        showToast("Pembayaran baru berhasil dicatat.");
      }
      loadData();
      return true;
    } catch (err: any) {
      console.error("Gagal simpan pembayaran:", err);
      return false;
    }
  }

  // Quick 1-Tap Tandai Lunas
  async function handleConfirmLunas(
    paymentId: string,
    paidDate: string,
    paymentMethod: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("payments")
        .update({
          status: "lunas",
          paid_date: paidDate,
          payment_method: paymentMethod,
        })
        .eq("id", paymentId);

      if (error) throw error;
      showToast("✓ Pembayaran berhasil ditandai LUNAS!");
      loadData();
      return true;
    } catch (err: any) {
      console.error("Gagal update status lunas:", err);
      return false;
    }
  }

  // Hapus Catatan Pembayaran
  async function handleDeletePayment(payment: Payment) {
    const confirmDelete = window.confirm(
      `Hapus catatan tagihan ini sebesar ${formatRupiah(payment.amount)}?`
    );
    if (!confirmDelete) return;

    try {
      const { error } = await supabase.from("payments").delete().eq("id", payment.id);
      if (error) throw error;
      showToast("Catatan pembayaran berhasil dihapus.");
      loadData();
    } catch (err: any) {
      console.error("Gagal menghapus pembayaran:", err);
      alert(`Gagal menghapus: ${err.message}`);
    }
  }

  // Buat Link WhatsApp Pengingat Tagihan
  function generateWhatsAppTagihanUrl(payment: Payment) {
    const tenant = tenantById.get(payment.tenant_id);
    const room = roomById.get(payment.room_id);
    if (!tenant?.phone_number) return null;

    const typeName = {
      sewa: "sewa kamar",
      listrik: "listrik",
      air: "air",
    }[payment.payment_type];

    const message = `Halo Kak ${tenant.full_name}, ini pengingat tagihan ${typeName} untuk Kamar ${
      room?.room_number || ""
    } sebesar ${formatRupiah(payment.amount)} (jatuh tempo: ${formatTanggal(
      payment.due_date
    )}). Pembayaran dapat ditransfer ke rekening pengelola. Mohon konfirmasi jika sudah ditransfer ya. Terima kasih! 🙏`;

    return `https://wa.me/${tenant.phone_number.replace(/\D/g, "")}?text=${encodeURIComponent(
      message
    )}`;
  }

  return (
    <div className="space-y-6">
      {/* Toast Notifikasi */}
      {toastMsg && (
        <div className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 rounded-xl bg-foreground text-card px-4 py-3 text-sm font-medium shadow-xl border border-border animate-in fade-in slide-in-from-bottom-2">
          {toastMsg}
        </div>
      )}

      {/* Header Halaman & Tombol Catat */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Pencatatan Pembayaran
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola tagihan sewa, listrik, dan air secara transparan
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              exportPembayaranCsv(filteredPayments, tenantById, roomById);
              showToast("File Rekap Pembayaran berhasil diunduh!");
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-xs"
            title="Unduh data pembayaran dalam format CSV/Excel"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
              <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
            </svg>
            <span>Unduh CSV</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setPaymentToEdit(null);
                setPreselectedTenantId(null);
                setIsFormOpen(true);
              }}
              className="btn-brand inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold shadow-xs"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
              </svg>
              <span>+ Catat Pembayaran</span>
            </button>
          )}
        </div>
      </div>

      {/* Bar Statistik Ringkasan Keuangan */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Lunas */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Penerimaan Lunas
            </span>
            <span className="h-2 w-2 rounded-full bg-status-kosong" />
          </div>
          <p className="mt-1 font-heading text-2xl font-bold text-status-kosong">
            {formatRupiah(stats.totalLunas)}
          </p>
          <span className="text-[11px] text-muted-foreground">Total pembayaran masuk</span>
        </div>

        {/* Belum Bayar */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Menunggu Pembayaran
            </span>
            <span className="h-2 w-2 rounded-full bg-status-maintenance" />
          </div>
          <p className="mt-1 font-heading text-2xl font-bold text-status-maintenance">
            {formatRupiah(stats.totalBelumBayar)}
          </p>
          <span className="text-[11px] text-muted-foreground">Belum jatuh tempo</span>
        </div>

        {/* Tunggakan / Telat */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Tunggakan (Telat)
            </span>
            <span className="h-2 w-2 rounded-full bg-status-terisi" />
          </div>
          <p className="mt-1 font-heading text-2xl font-bold text-status-terisi">
            {formatRupiah(stats.totalTunggakan)}
          </p>
          <span className="text-[11px] text-muted-foreground">Melewati jatuh tempo</span>
        </div>
      </div>

      {/* Kontrol Filter & Tab Navigasi */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Tab Button */}
          <div className="flex w-full md:w-auto rounded-lg bg-muted p-1 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("tagihan")}
              className={`whitespace-nowrap rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeTab === "tagihan"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Perlu Ditagih ({stats.jumlahPerluDitagih})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("lunas")}
              className={`whitespace-nowrap rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeTab === "lunas"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sudah Lunas
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("semua")}
              className={`whitespace-nowrap rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeTab === "semua"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Semua ({payments.length})
            </button>
          </div>

          {/* Filter Jenis Tagihan */}
          <div className="flex items-center gap-1 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {(
              [
                { id: "semua", label: "Semua", icon: null },
                { id: "sewa", label: "Sewa", icon: HomeIcon },
                { id: "listrik", label: "Listrik", icon: ZapIcon },
                { id: "air", label: "Air", icon: DropletIcon },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTypeFilter(item.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                    typeFilter === item.id
                      ? "bg-brand text-white shadow-xs"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  }`}
                >
                  {Icon && <Icon size={13} />}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau kamar..."
              className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-1.5 text-xs focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
        </div>
      </div>

      {/* List Pembayaran */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-xl border border-border bg-card/60 animate-pulse p-4"
            />
          ))}
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border bg-card/40 p-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <CoinsIcon size={22} />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            Tidak ada data pembayaran
          </h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            {activeTab === "tagihan"
              ? "Semua tagihan telah lunas! Tidak ada tagihan yang tertunda saat ini."
              : "Belum ada catatan pembayaran yang cocok dengan filter."}
          </p>
          <button
            type="button"
            onClick={() => {
              setPaymentToEdit(null);
              setPreselectedTenantId(null);
              setIsFormOpen(true);
            }}
            className="btn-brand mt-4 px-4 py-2 text-xs"
          >
            + Catat Pembayaran Baru
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPayments.map((payment) => {
            const tenant = tenantById.get(payment.tenant_id);
            const room = roomById.get(payment.room_id);
            const waUrl = generateWhatsAppTagihanUrl(payment);
            const selisihHari = hitungSelisihHari(payment.due_date);

            // Tipe tagihan config
            const typeBadge = {
              sewa: { label: "Sewa Kamar", icon: HomeIcon, badgeClass: "bg-blue-50 text-blue-700" },
              listrik: { label: "Listrik", icon: ZapIcon, badgeClass: "bg-amber-50 text-amber-700" },
              air: { label: "Air", icon: DropletIcon, badgeClass: "bg-cyan-50 text-cyan-700" },
            }[payment.payment_type];
            const TypeIcon = typeBadge.icon;

            // Status tagihan config
            const statusConfig = {
              lunas: { label: "Lunas", badgeClass: "badge-kosong" },
              belum_bayar: { label: "Belum Bayar", badgeClass: "badge-maintenance" },
              telat: { label: "Telat", badgeClass: "badge-terisi" },
            }[payment.status];

            return (
              <div
                key={payment.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-xs hover:border-brand/30 transition-all"
              >
                {/* Bagian Kiri: Tenant, Kamar, Jenis, Nominal */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${typeBadge.badgeClass}`}
                    >
                      <TypeIcon size={12} />
                      <span>{typeBadge.label}</span>
                    </span>

                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusConfig.badgeClass}`}
                    >
                      {statusConfig.label}
                    </span>

                    {room && (
                      <span className="text-xs font-semibold text-brand">
                        Kamar {room.room_number}
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-2">
                    <h3 className="font-heading text-lg font-bold text-foreground">
                      {tenant?.full_name || "Penyewa Tidak Dikenal"}
                    </h3>
                    <span className="font-heading text-lg font-bold text-foreground">
                      • {formatRupiah(payment.amount)}
                    </span>
                  </div>

                  {/* Keterangan Tanggal & Status Relatif */}
                  <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                    {payment.status === "lunas" ? (
                      <span>
                        Diterima: <strong>{payment.paid_date ? formatTanggal(payment.paid_date) : "-"}</strong> ({payment.payment_method || "Transfer"})
                      </span>
                    ) : payment.status === "telat" ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-status-terisi">
                        <AlertCircleIcon size={12} />
                        <span>Terlambat {Math.abs(selisihHari)} hari (Jatuh tempo: {formatTanggal(payment.due_date)})</span>
                      </span>
                    ) : (
                      <span>
                        Jatuh tempo: <strong>{formatTanggal(payment.due_date)}</strong>
                        {selisihHari >= 0 && (
                          <span className="ml-1 text-status-maintenance font-medium">
                            ({selisihHari === 0 ? "Hari ini" : `${selisihHari} hari lagi`})
                          </span>
                        )}
                      </span>
                    )}

                    {payment.notes && (
                      <span className="italic text-muted-foreground/80">
                        • &quot;{payment.notes}&quot;
                      </span>
                    )}
                  </div>
                </div>

                {/* Bagian Kanan: Tombol Aksi */}
                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
                  {/* Tombol Tandai Lunas Cepat jika belum lunas (Khusus Admin) */}
                  {isAdmin && payment.status !== "lunas" && (
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentToMarkLunas(payment);
                        setIsLunasOpen(true);
                      }}
                      className="inline-flex items-center gap-1 rounded-xl bg-status-kosong px-3 py-2 text-xs font-semibold text-white shadow-xs hover:bg-status-kosong/90 transition-colors"
                    >
                      <CheckIcon size={12} />
                      <span>Tandai Lunas</span>
                    </button>
                  )}

                  {/* Tombol Kuitansi jika sudah lunas */}
                  {payment.status === "lunas" && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPaymentForKuitansi(payment);
                        setIsKuitansiOpen(true);
                      }}
                      className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-xs hover:bg-muted transition-colors"
                      title="Lihat kuitansi resmi & kirim ke WhatsApp"
                    >
                      <ReceiptIcon size={13} />
                      <span>Kuitansi</span>
                    </button>
                  )}

                  {/* Tombol Kirim Tagihan WhatsApp */}
                  {payment.status !== "lunas" && waUrl && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white shadow-xs hover:bg-green-700 transition-colors"
                      title="Kirim pengingat tagihan via WhatsApp"
                    >
                      <WhatsAppIcon size={12} />
                      <span>Tagih WA</span>
                    </a>
                  )}

                  {/* Tombol Edit & Hapus (Khusus Admin) */}
                  {isAdmin && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentToEdit(payment);
                          setIsFormOpen(true);
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors touch-manipulation"
                        aria-label="Edit tagihan"
                        title="Edit tagihan"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                          <path d="m2.695 14.762-1.262 3.155a.5.5 0 0 0 .65.65l3.155-1.262a4 4 0 0 0 1.343-.882L17.5 5.501a2.121 2.121 0 0 0-3-3L3.577 13.419a4 4 0 0 0-.882 1.343Z" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeletePayment(payment)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-destructive hover:bg-status-terisi-bg transition-colors touch-manipulation"
                        aria-label="Hapus tagihan"
                        title="Hapus tagihan"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                          <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Form Catat / Edit */}
      <PembayaranFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setPaymentToEdit(null);
          setPreselectedTenantId(null);
        }}
        paymentToEdit={paymentToEdit}
        tenants={tenants}
        rooms={rooms}
        preselectedTenantId={preselectedTenantId}
        onSave={handleSavePayment}
      />

      {/* Modal 1-Tap Tandai Lunas */}
      <PembayaranLunasModal
        isOpen={isLunasOpen}
        onClose={() => {
          setIsLunasOpen(false);
          setPaymentToMarkLunas(null);
        }}
        payment={paymentToMarkLunas}
        tenant={
          paymentToMarkLunas ? tenantById.get(paymentToMarkLunas.tenant_id) : null
        }
        room={
          paymentToMarkLunas ? roomById.get(paymentToMarkLunas.room_id) : null
        }
        onConfirmLunas={handleConfirmLunas}
      />

      {/* Modal Kuitansi Digital Lunas */}
      <KuitansiModal
        isOpen={isKuitansiOpen}
        onClose={() => {
          setIsKuitansiOpen(false);
          setSelectedPaymentForKuitansi(null);
        }}
        payment={selectedPaymentForKuitansi}
        tenant={
          selectedPaymentForKuitansi
            ? tenantById.get(selectedPaymentForKuitansi.tenant_id) || null
            : null
        }
        room={
          selectedPaymentForKuitansi
            ? roomById.get(selectedPaymentForKuitansi.room_id) || null
            : null
        }
      />
    </div>
  );
}

export default function PembayaranPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-28 rounded-xl bg-card border border-border animate-pulse" />
        </div>
      }
    >
      <PembayaranContent />
    </Suspense>
  );
}
