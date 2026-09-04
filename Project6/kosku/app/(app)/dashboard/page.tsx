"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Room, Tenant, Payment, PaymentStatus, PaymentInsert, Expense } from "@/types/database";
import { formatRupiah, formatTanggal, hitungSelisihHari } from "@/lib/utils";
import { PembayaranFormModal } from "@/components/pembayaran/pembayaran-form-modal";
import { PembayaranLunasModal } from "@/components/pembayaran/pembayaran-lunas-modal";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useUser } from "@/lib/context/user-context";
import {
  DoorIcon,
  AlertCircleIcon,
  ClockIcon,
  WhatsAppIcon,
  CheckIcon,
} from "@/components/shared/icons";

export default function DashboardPage() {
  const { isAdmin } = useUser();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLunasOpen, setIsLunasOpen] = useState(false);
  const [paymentToMarkLunas, setPaymentToMarkLunas] = useState<Payment | null>(null);

  const supabase = createClient();

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 3500);
  }

  // Fetch all core data
  async function loadData() {
    setLoading(true);
    try {
      const [
        { data: roomsData },
        { data: tenantsData },
        { data: paymentsData },
        { data: expensesData },
      ] = await Promise.all([
        supabase.from("rooms").select("*").order("room_number", { ascending: true }),
        supabase.from("tenants").select("*").order("full_name", { ascending: true }),
        supabase.from("payments").select("*").order("due_date", { ascending: true }),
        supabase.from("expenses").select("*"),
      ]);

      const todayStr = new Date().toISOString().split("T")[0];
      const normalizedPayments = ((paymentsData as Payment[]) || []).map((p: Payment) => {
        if (p.status === "belum_bayar" && p.due_date < todayStr) {
          return { ...p, status: "telat" as PaymentStatus };
        }
        return p;
      });

      setRooms((roomsData as Room[]) || []);
      setTenants((tenantsData as Tenant[]) || []);
      setPayments(normalizedPayments);
      setExpenses((expensesData as Expense[]) || []);
    } catch (err: any) {
      console.error("Gagal memuat dashboard:", err);
      showToast("Gagal memuat data dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

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

  // Statistik Okupansi
  const roomStats = useMemo(() => {
    const total = rooms.length;
    const terisi = rooms.filter((r) => r.status === "terisi").length;
    const kosong = rooms.filter((r) => r.status === "kosong").length;
    const maintenance = rooms.filter((r) => r.status === "maintenance").length;
    const persentase = total > 0 ? Math.round((terisi / total) * 100) : 0;
    return { total, terisi, kosong, maintenance, persentase };
  }, [rooms]);

  // Statistik Keuangan Bulan Berjalan
  const financialStats = useMemo(() => {
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;

    // Total Lunas Bulan Ini
    const lunasBulanIni = payments
      .filter(
        (p) =>
          p.status === "lunas" &&
          (p.paid_date?.startsWith(currentMonthPrefix) ||
            p.due_date.startsWith(currentMonthPrefix))
      )
      .reduce((acc, curr) => acc + Number(curr.amount), 0);

    // Total Tunggakan (semua yang telat)
    const tunggakan = payments.filter((p) => p.status === "telat");
    const totalTunggakan = tunggakan.reduce(
      (acc, curr) => acc + Number(curr.amount),
      0
    );

    // Jatuh tempo dalam 3 hari ke depan (hari ini s/d +3 hari, belum lunas)
    const upcomingDue = payments.filter((p) => {
      if (p.status === "lunas") return false;
      const selisih = hitungSelisihHari(p.due_date);
      return selisih >= 0 && selisih <= 3;
    });

    const activeTenantsCount = tenants.filter((t) => t.is_active).length;

    // Total Pengeluaran Bulan Ini
    const pengeluaranBulanIni = expenses
      .filter((e) => e.expense_date?.startsWith(currentMonthPrefix))
      .reduce((acc, curr) => acc + Number(curr.amount), 0);

    // Keuntungan Bersih Bulan Ini
    const labaBersihBulanIni = lunasBulanIni - pengeluaranBulanIni;

    return {
      lunasBulanIni,
      pengeluaranBulanIni,
      labaBersihBulanIni,
      tunggakan,
      totalTunggakan,
      upcomingDue,
      activeTenantsCount,
    };
  }, [payments, tenants, expenses]);

  // Data Chart: Pemasukan per Kategori
  const categoryChartData = useMemo(() => {
    const sewa = payments
      .filter((p) => p.status === "lunas" && p.payment_type === "sewa")
      .reduce((a, c) => a + Number(c.amount), 0);
    const listrik = payments
      .filter((p) => p.status === "lunas" && p.payment_type === "listrik")
      .reduce((a, c) => a + Number(c.amount), 0);
    const air = payments
      .filter((p) => p.status === "lunas" && p.payment_type === "air")
      .reduce((a, c) => a + Number(c.amount), 0);

    return [
      { name: "Sewa Kamar", amount: sewa, color: "#4F7A5C" },
      { name: "Listrik", amount: listrik, color: "#C99A3E" },
      { name: "Air", amount: air, color: "#2B7A78" },
    ];
  }, [payments]);

  // Kamar kosong siap huni
  const emptyRooms = useMemo(
    () => rooms.filter((r) => r.status === "kosong"),
    [rooms]
  );

  // Handler Simpan Pembayaran dari Dashboard
  async function handleSavePayment(payload: PaymentInsert): Promise<boolean> {
    try {
      const { error } = await supabase.from("payments").insert([payload]);
      if (error) throw error;
      showToast("Pembayaran berhasil dicatat.");
      loadData();
      return true;
    } catch (err: any) {
      console.error("Gagal simpan pembayaran:", err);
      return false;
    }
  }

  // Handler 1-Tap Lunas
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
      showToast("✓ Tagihan berhasil ditandai LUNAS!");
      loadData();
      return true;
    } catch (err: any) {
      console.error("Gagal update status lunas:", err);
      return false;
    }
  }

  // Helper link WhatsApp
  function getWhatsAppUrl(payment: Payment) {
    const tenant = tenantById.get(payment.tenant_id);
    const room = roomById.get(payment.room_id);
    if (!tenant?.phone_number) return null;

    const message = `Halo Kak ${tenant.full_name}, pengingat tagihan kos untuk Kamar ${
      room?.room_number || ""
    } sebesar ${formatRupiah(payment.amount)} (jatuh tempo: ${formatTanggal(
      payment.due_date
    )}). Mohon konfirmasi jika sudah ditransfer ya. Terima kasih! 🙏`;

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

      {/* Header Dashboard & Tombol Aksi Cepat */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Ringkasan Kos Hari Ini
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="btn-brand inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold shadow-xs"
            >
              <span>+</span>
              <span>Catat Bayar</span>
            </button>
          )}
          <Link
            href="/penyewa"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <span>+</span>
            <span>Penyewa</span>
          </Link>
          <Link
            href="/kamar"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <DoorIcon size={14} className="text-muted-foreground" />
            <span>Grid Kamar</span>
          </Link>
        </div>
      </div>

      {/* 5 Kartu Metrik Utama */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Okupansi Kamar */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Okupansi</span>
            <span className="text-xs font-semibold text-brand">
              {roomStats.persentase}%
            </span>
          </div>
          <p className="mt-1 font-heading text-2xl font-bold text-foreground">
            {roomStats.terisi} / {roomStats.total}{" "}
            <span className="text-xs font-normal text-muted-foreground">kamar</span>
          </p>
          {/* Progress bar visual */}
          <div className="mt-2.5 h-2 w-full rounded-full bg-muted overflow-hidden flex">
            <div
              style={{ width: `${(roomStats.terisi / (roomStats.total || 1)) * 100}%` }}
              className="bg-status-terisi h-full transition-all"
            />
            <div
              style={{ width: `${(roomStats.maintenance / (roomStats.total || 1)) * 100}%` }}
              className="bg-status-maintenance h-full transition-all"
            />
            <div
              style={{ width: `${(roomStats.kosong / (roomStats.total || 1)) * 100}%` }}
              className="bg-status-kosong h-full transition-all"
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{roomStats.kosong} Kosong</span>
            <span>{roomStats.maintenance} Perbaikan</span>
          </div>
        </div>

        {/* Pemasukan Lunas */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Pemasukan Lunas</span>
            <span className="h-2 w-2 rounded-full bg-status-kosong" />
          </div>
          <p className="mt-1 font-heading text-2xl font-bold text-status-kosong">
            {formatRupiah(financialStats.lunasBulanIni)}
          </p>
          <span className="text-[11px] text-muted-foreground mt-2 block">
            Bulan berjalan
          </span>
        </div>

        {/* Biaya Operasional */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Biaya Operasional</span>
            <span className="h-2 w-2 rounded-full bg-orange-500" />
          </div>
          <p className="mt-1 font-heading text-2xl font-bold text-foreground">
            {formatRupiah(financialStats.pengeluaranBulanIni)}
          </p>
          <Link
            href="/pengeluaran"
            className="text-[11px] font-semibold text-brand hover:underline mt-2 block"
          >
            Rincian biaya →
          </Link>
        </div>

        {/* Keuntungan Bersih (Laba) */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Laba Bersih</span>
            <span
              className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                financialStats.labaBersihBulanIni >= 0
                  ? "bg-status-kosong-bg text-status-kosong"
                  : "bg-status-terisi-bg text-status-terisi"
              }`}
            >
              {financialStats.labaBersihBulanIni >= 0 ? "Surplus" : "Defisit"}
            </span>
          </div>
          <p
            className={`mt-1 font-heading text-2xl font-bold ${
              financialStats.labaBersihBulanIni >= 0
                ? "text-status-kosong"
                : "text-status-terisi"
            }`}
          >
            {formatRupiah(financialStats.labaBersihBulanIni)}
          </p>
          <Link
            href="/pengeluaran"
            className="text-[11px] font-semibold text-brand hover:underline mt-2 block"
          >
            Laporan laba-rugi →
          </Link>
        </div>

        {/* Total Tunggakan (Kritis) */}
        <div
          className={`rounded-xl border p-4 shadow-xs transition-all col-span-2 sm:col-span-1 ${
            financialStats.totalTunggakan > 0
              ? "border-status-terisi/40 bg-status-terisi-bg"
              : "border-border bg-card"
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium text-status-terisi">
              Total Tunggakan
            </span>
            {financialStats.tunggakan.length > 0 && (
              <span className="rounded-full bg-status-terisi text-white px-2 py-0.5 text-[10px] font-bold">
                {financialStats.tunggakan.length}
              </span>
            )}
          </div>
          <p
            className={`mt-1 font-heading text-2xl font-bold ${
              financialStats.totalTunggakan > 0
                ? "text-status-terisi"
                : "text-foreground"
            }`}
          >
            {formatRupiah(financialStats.totalTunggakan)}
          </p>
          <span className="text-[11px] text-muted-foreground mt-2 block">
            {financialStats.tunggakan.length > 0
              ? `${financialStats.tunggakan.length} tagihan perlu ditagih`
              : "Semua pembayaran tepat waktu"}
          </span>
        </div>
      </div>

      {/* Bagian Prioritas: Daftar Menunggak & Jatuh Tempo Mendatang */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daftar Menunggak */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-status-terisi-bg text-status-terisi">
                <AlertCircleIcon size={14} />
              </span>
              <h2 className="font-heading text-base font-bold text-foreground">
                Perlu Ditagih (Menunggak)
              </h2>
            </div>
            <span className="rounded-full bg-status-terisi-bg px-2.5 py-0.5 text-xs font-semibold text-status-terisi">
              {financialStats.tunggakan.length}
            </span>
          </div>

          {financialStats.tunggakan.length === 0 ? (
            <div className="rounded-xl bg-status-kosong-bg border border-status-kosong/20 p-5 text-center">
              <p className="text-xs font-semibold text-status-kosong">
                Tidak ada tagihan menunggak saat ini.
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Semua penghuni telah melunasi tagihan mereka tepat waktu.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {financialStats.tunggakan.map((item) => {
                const tenant = tenantById.get(item.tenant_id);
                const room = roomById.get(item.room_id);
                const waUrl = getWhatsAppUrl(item);
                const telatHari = Math.abs(hitungSelisihHari(item.due_date));

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-status-terisi/20 bg-status-terisi-bg/30 p-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-foreground truncate">
                          {tenant?.full_name || "Penyewa"}
                        </span>
                        {room && (
                          <span className="rounded bg-card px-1.5 py-0.5 text-[10px] font-semibold text-brand">
                            Kamar {room.room_number}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-status-terisi mt-0.5">
                        {formatRupiah(item.amount)}
                        <span className="font-normal text-[11px] text-muted-foreground ml-1.5">
                          (Telat {telatHari} hari)
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {waUrl && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-xs hover:bg-green-700 transition-colors"
                        >
                          <WhatsAppIcon size={12} />
                          <span>WA</span>
                        </a>
                      )}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentToMarkLunas(item);
                            setIsLunasOpen(true);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-status-kosong px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-xs hover:bg-status-kosong/90 transition-colors"
                        >
                          <CheckIcon size={12} />
                          <span>Lunas</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Jatuh Tempo 3 Hari ke Depan */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-status-maintenance-bg text-status-maintenance">
                <ClockIcon size={14} />
              </span>
              <h2 className="font-heading text-base font-bold text-foreground">
                Jatuh Tempo (3 Hari Kedepan)
              </h2>
            </div>
            <span className="rounded-full bg-status-maintenance-bg px-2.5 py-0.5 text-xs font-semibold text-status-maintenance">
              {financialStats.upcomingDue.length}
            </span>
          </div>

          {financialStats.upcomingDue.length === 0 ? (
            <div className="rounded-xl bg-muted/40 border border-border p-5 text-center">
              <p className="text-xs font-medium text-muted-foreground">
                Tidak ada tagihan yang jatuh tempo dalam 3 hari ke depan.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {financialStats.upcomingDue.map((item) => {
                const tenant = tenantById.get(item.tenant_id);
                const room = roomById.get(item.room_id);
                const waUrl = getWhatsAppUrl(item);
                const sisaHari = hitungSelisihHari(item.due_date);

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-foreground truncate">
                          {tenant?.full_name || "Penyewa"}
                        </span>
                        {room && (
                          <span className="rounded bg-brand-muted px-1.5 py-0.5 text-[10px] font-semibold text-brand">
                            Kamar {room.room_number}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-foreground mt-0.5">
                        {formatRupiah(item.amount)}
                        <span className="font-medium text-[11px] text-status-maintenance ml-1.5">
                          • {sisaHari === 0 ? "Hari ini!" : `${sisaHari} hari lagi`}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {waUrl && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-xs hover:bg-green-700 transition-colors"
                        >
                          <WhatsAppIcon size={12} />
                          <span>Ingatkan</span>
                        </a>
                      )}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentToMarkLunas(item);
                            setIsLunasOpen(true);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-status-kosong px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-xs hover:bg-status-kosong/90 transition-colors"
                        >
                          <CheckIcon size={12} />
                          <span>Lunas</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bagian Bawah: Grafik Penerimaan per Kategori & Kamar Kosong Siap Huni */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Grafik Penerimaan */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-base font-bold text-foreground">
              Komposisi Penerimaan Lunas
            </h2>
            <Link
              href="/pembayaran"
              className="text-xs font-semibold text-brand hover:underline"
            >
              Lihat Rincian →
            </Link>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickFormatter={(val) => `Rp ${(val / 1000).toLocaleString("id-ID")}k`}
                />
                <Tooltip
                  formatter={(val: any) => [formatRupiah(Number(val)), "Penerimaan"]}
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Kamar Kosong Siap Huni */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-status-kosong" />
              <h2 className="font-heading text-base font-bold text-foreground">
                Kamar Kosong Siap Huni ({emptyRooms.length})
              </h2>
            </div>
            <Link
              href="/kamar"
              className="text-xs font-semibold text-brand hover:underline"
            >
              Semua Kamar →
            </Link>
          </div>

          {emptyRooms.length === 0 ? (
            <div className="rounded-xl bg-muted/40 border border-border p-6 text-center">
              <p className="text-xs text-muted-foreground">
                Semua kamar saat ini penuh atau dalam perbaikan!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {emptyRooms.slice(0, 6).map((room) => (
                <div
                  key={room.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-background p-2.5"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-heading text-sm font-bold text-foreground">
                        Kamar {room.room_number}
                      </span>
                      <span
                        className={`rounded px-1 py-0.2 text-[10px] font-semibold ${
                          room.room_type === "ac"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {room.room_type.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-muted-foreground mt-0.5 block">
                      {formatRupiah(room.monthly_price)}
                    </span>
                  </div>

                  {isAdmin && (
                    <Link
                      href={`/penyewa?tambah=true&room_id=${room.id}`}
                      className="rounded-md bg-brand-muted text-brand hover:bg-brand hover:text-white px-2 py-1 text-[11px] font-semibold transition-colors"
                    >
                      + Isi
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Form Catat Pembayaran */}
      <PembayaranFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        tenants={tenants}
        rooms={rooms}
        onSave={handleSavePayment}
      />

      {/* Modal Tandai Lunas Cepat */}
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
    </div>
  );
}
