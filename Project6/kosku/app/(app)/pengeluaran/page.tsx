"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Expense,
  ExpenseInsert,
  ExpenseCategory,
  Room,
  Payment,
  Tenant,
} from "@/types/database";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import { exportLaporanBulananCsv, exportPengeluaranCsv } from "@/lib/export-utils";
import { PengeluaranFormModal } from "@/components/pengeluaran/pengeluaran-form-modal";
import { LaporanPrintModal } from "@/components/pengeluaran/laporan-print-modal";
import { Modal } from "@/components/shared/modal";
import { useUser } from "@/lib/context/user-context";
import {
  ZapIcon,
  DropletIcon,
  WrenchIcon,
  SparklesIcon,
  UsersIcon,
  BoxIcon,
  ReceiptIcon,
  CoinsIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  BarChartIcon,
  WhatsAppIcon,
} from "@/components/shared/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const CATEGORY_MAP: Record<
  ExpenseCategory,
  {
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    colorClass: string;
    bgClass: string;
  }
> = {
  listrik: {
    label: "Listrik Induk",
    icon: ZapIcon,
    colorClass: "text-amber-700",
    bgClass: "bg-amber-50 border-amber-200",
  },
  air: {
    label: "Air / PDAM",
    icon: DropletIcon,
    colorClass: "text-blue-700",
    bgClass: "bg-blue-50 border-blue-200",
  },
  pemeliharaan: {
    label: "Servis & Perbaikan",
    icon: WrenchIcon,
    colorClass: "text-orange-700",
    bgClass: "bg-orange-50 border-orange-200",
  },
  kebersihan: {
    label: "Kebersihan & Sampah",
    icon: SparklesIcon,
    colorClass: "text-emerald-700",
    bgClass: "bg-emerald-50 border-emerald-200",
  },
  gaji: {
    label: "Gaji / Upah",
    icon: UsersIcon,
    colorClass: "text-purple-700",
    bgClass: "bg-purple-50 border-purple-200",
  },
  lainnya: {
    label: "Lainnya",
    icon: BoxIcon,
    colorClass: "text-stone-700",
    bgClass: "bg-stone-50 border-stone-200",
  },
};

const NAMA_BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function PengeluaranContent() {
  const { isAdmin } = useUser();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<"daftar" | "labarugi">("daftar");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Filter Catatan Pengeluaran
  const [categoryFilter, setCategoryFilter] = useState<string>("semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<"bulan_ini" | "bulan_lalu" | "semua">("bulan_ini");

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Periode Laporan Laba-Rugi
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 3500);
  }

  // Load Data
  async function loadData() {
    setLoading(true);
    try {
      const [
        { data: expensesData, error: expError },
        { data: roomsData, error: roomsError },
        { data: paymentsData, error: payError },
        { data: tenantsData },
      ] = await Promise.all([
        supabase.from("expenses").select("*").order("expense_date", { ascending: false }),
        supabase.from("rooms").select("*").order("room_number", { ascending: true }),
        supabase.from("payments").select("*").eq("status", "lunas"),
        supabase.from("tenants").select("*"),
      ]);

      if (expError) {
        console.warn("Tabel expenses mungkin belum dieksekusi di Supabase:", expError.message);
      }
      if (roomsError) throw roomsError;
      if (payError) throw payError;

      setExpenses(expensesData || []);
      setRooms(roomsData || []);
      setPayments(paymentsData || []);
      setTenants(tenantsData || []);
    } catch (err: any) {
      console.error("Gagal memuat data pengeluaran:", err);
      showToast("Gagal memuat data pengeluaran.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Room & Tenant lookup maps
  const roomById = useMemo(() => {
    const map = new Map<string, Room>();
    rooms.forEach((r) => map.set(r.id, r));
    return map;
  }, [rooms]);

  const tenantById = useMemo(() => {
    const map = new Map<string, Tenant>();
    tenants.forEach((t) => map.set(t.id, t));
    return map;
  }, [tenants]);

  // Current Month & Prev Month Prefixes
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(
    prevMonthDate.getMonth() + 1
  ).padStart(2, "0")}`;

  // Filtered Expenses (Tab 1)
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      // 1. Kategori
      if (categoryFilter !== "semua" && e.category !== categoryFilter) {
        return false;
      }
      // 2. Waktu
      if (timeFilter === "bulan_ini" && !e.expense_date.startsWith(currentMonthStr)) {
        return false;
      }
      if (timeFilter === "bulan_lalu" && !e.expense_date.startsWith(prevMonthStr)) {
        return false;
      }
      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const descMatch = e.description.toLowerCase().includes(q);
        const room = e.room_id ? roomById.get(e.room_id) : null;
        const roomMatch = room ? room.room_number.toLowerCase().includes(q) : false;
        return descMatch || roomMatch;
      }
      return true;
    });
  }, [expenses, categoryFilter, timeFilter, searchQuery, currentMonthStr, prevMonthStr, roomById]);

  // Total Pengeluaran Terfilter
  const totalFilteredAmount = useMemo(() => {
    return filteredExpenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
  }, [filteredExpenses]);

  // Laba Rugi Calculations for Selected Month & Year (Tab 2)
  const pnlData = useMemo(() => {
    const targetMonthPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;

    // 1. Total Pemasukan Lunas di bulan ini
    const monthlyPayments = payments.filter((p) => {
      if (p.status !== "lunas") return false;
      const dateToCheck = p.paid_date || p.due_date;
      return dateToCheck.startsWith(targetMonthPrefix);
    });
    const totalRevenue = monthlyPayments.reduce((acc, curr) => acc + Number(curr.amount), 0);

    // 2. Total Pengeluaran di bulan ini
    const monthlyExpenses = expenses.filter((e) => e.expense_date.startsWith(targetMonthPrefix));
    const totalExpense = monthlyExpenses.reduce((acc, curr) => acc + Number(curr.amount), 0);

    // 3. Laba Bersih
    const netProfit = totalRevenue - totalExpense;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // 4. Breakdown per kategori
    const categoryTotals: Record<ExpenseCategory, number> = {
      listrik: 0,
      air: 0,
      pemeliharaan: 0,
      kebersihan: 0,
      gaji: 0,
      lainnya: 0,
    };

    monthlyExpenses.forEach((e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + Number(e.amount);
    });

    return {
      targetMonthPrefix,
      totalRevenue,
      revenueCount: monthlyPayments.length,
      totalExpense,
      expenseCount: monthlyExpenses.length,
      netProfit,
      profitMargin,
      categoryTotals,
      monthlyExpenses,
    };
  }, [payments, expenses, selectedMonth, selectedYear]);

  // Data 6 Bulan Terakhir untuk Grafik Recharts
  const chartData = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = NAMA_BULAN[d.getMonth()].slice(0, 3);

      const rev = payments
        .filter((p) => {
          if (p.status !== "lunas") return false;
          const dt = p.paid_date || p.due_date;
          return dt.startsWith(prefix);
        })
        .reduce((sum, p) => sum + Number(p.amount), 0);

      const exp = expenses
        .filter((e) => e.expense_date.startsWith(prefix))
        .reduce((sum, e) => sum + Number(e.amount), 0);

      data.push({
        bulan: `${monthLabel} '${String(d.getFullYear()).slice(2)}`,
        Pemasukan: rev,
        Pengeluaran: exp,
        Laba: rev - exp,
      });
    }
    return data;
  }, [payments, expenses]);

  // CRUD Handlers
  async function handleSaveExpense(payload: ExpenseInsert, expenseId?: string): Promise<boolean> {
    try {
      if (expenseId) {
        const { error } = await supabase
          .from("expenses")
          .update(payload)
          .eq("id", expenseId);
        if (error) throw error;
        showToast("Catatan pengeluaran berhasil diperbarui.");
      } else {
        const { error } = await supabase.from("expenses").insert(payload);
        if (error) throw error;
        showToast("Pengeluaran baru berhasil dicatat.");
      }
      await loadData();
      return true;
    } catch (err: any) {
      console.error("Error saving expense:", err);
      showToast("Gagal menyimpan pengeluaran: " + (err.message || "Periksa tabel SQL"));
      return false;
    }
  }

  async function handleDeleteExpense() {
    if (!expenseToDelete) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", expenseToDelete.id);
      if (error) throw error;

      showToast("Catatan pengeluaran berhasil dihapus.");
      setExpenseToDelete(null);
      await loadData();
    } catch (err: any) {
      console.error("Error deleting expense:", err);
      showToast("Gagal menghapus catatan pengeluaran.");
    } finally {
      setIsDeleting(false);
    }
  }

  // Salin Rangkuman Laba-Rugi ke WhatsApp
  function handleCopySummaryWA() {
    const namaBulan = NAMA_BULAN[selectedMonth];
    const categoryBreakdownText = (Object.keys(pnlData.categoryTotals) as ExpenseCategory[])
      .filter((cat) => pnlData.categoryTotals[cat] > 0)
      .map(
        (cat) =>
          `- ${CATEGORY_MAP[cat].icon} ${CATEGORY_MAP[cat].label}: ${formatRupiah(
            pnlData.categoryTotals[cat]
          )}`
      )
      .join("\n");

    const text = `📊 *LAPORAN KEUANGAN KOSKU*
Periode: *${namaBulan} ${selectedYear}*
───────────────────────
💰 *Total Pemasukan (Lunas):* ${formatRupiah(pnlData.totalRevenue)} (${pnlData.revenueCount} transaksi)
💸 *Total Pengeluaran:* ${formatRupiah(pnlData.totalExpense)} (${pnlData.expenseCount} catatan)

*Rincian Biaya Operasional:*
${categoryBreakdownText || "- Belum ada catatan pengeluaran"}
───────────────────────
📈 *KEUNTUNGAN BERSIH:* ${formatRupiah(pnlData.netProfit)}
📊 *Margin Keuntungan:* ${pnlData.profitMargin.toFixed(1)}%
Status: *${pnlData.netProfit >= 0 ? "SURPLUS (UNTUNG) ✅" : "DEFISIT (MINUS) ⚠️"}*

_Laporan otomatis dari Sistem Manajemen KosKu Keluarga_`;

    navigator.clipboard.writeText(text);
    showToast("Ringkasan laporan disalin ke clipboard! Siap dipaste ke WhatsApp.");
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-20 lg:bottom-6 right-6 z-50 rounded-xl bg-foreground px-4 py-3 text-xs font-semibold text-background shadow-lg transition-all animate-in fade-in slide-in-from-bottom-3">
          {toastMsg}
        </div>
      )}

      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
            Pengeluaran & Laba-Rugi
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pencatatan biaya operasional kos keluarga dan kalkulasi keuntungan bersih otomatis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportPengeluaranCsv(filteredExpenses, roomById)}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-xs"
            title="Unduh CSV data pengeluaran terfilter"
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
              onClick={() => {
                setExpenseToEdit(null);
                setIsFormOpen(true);
              }}
              className="btn-brand flex items-center justify-center gap-2 self-start sm:self-auto px-4 py-2.5 text-xs font-semibold shadow-xs"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
              </svg>
              + Catat Pengeluaran
            </button>
          )}
        </div>
      </div>

      {/* Navigasi Tab Utama */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("daftar")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
            activeTab === "daftar"
              ? "border-brand text-brand"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path
              fillRule="evenodd"
              d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm2.25 8.5a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 3a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Z"
              clipRule="evenodd"
            />
          </svg>
          Catatan Pengeluaran ({expenses.length})
        </button>
        <button
          onClick={() => setActiveTab("labarugi")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
            activeTab === "labarugi"
              ? "border-brand text-brand"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path d="M12 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
            <path
              fillRule="evenodd"
              d="M3 4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4Zm8 4a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3.707 5.707a1 1 0 0 0-1.414-1.414l-2.5 2.5a1 1 0 0 0 0 1.414l2.5 2.5a1 1 0 0 0 1.414-1.414L13.414 15l1.293-1.293Z"
              clipRule="evenodd"
            />
          </svg>
          Laporan Laba-Rugi Kasar
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: DAFTAR CATATAN PENGELUARAN */}
      {/* ==================================================================== */}
      {activeTab === "daftar" && (
        <div className="space-y-4">
          {/* Bar Filter & Pencarian */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border">
            {/* Filter Waktu */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <button
                onClick={() => setTimeFilter("bulan_ini")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                  timeFilter === "bulan_ini"
                    ? "bg-brand text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Bulan Ini
              </button>
              <button
                onClick={() => setTimeFilter("bulan_lalu")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                  timeFilter === "bulan_lalu"
                    ? "bg-brand text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Bulan Lalu
              </button>
              <button
                onClick={() => setTimeFilter("semua")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                  timeFilter === "semua"
                    ? "bg-brand text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Semua Waktu
              </button>
            </div>

            {/* Pencarian */}
            <div className="relative w-full md:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari keterangan / kamar..."
                className="w-full rounded-xl border border-border bg-card pl-9 pr-3 py-2 text-xs font-medium focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>

          {/* Kategori Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setCategoryFilter("semua")}
              className={`rounded-full border px-3 py-1 font-medium transition-colors ${
                categoryFilter === "semua"
                  ? "border-brand bg-brand-muted text-brand font-semibold"
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              Semua Kategori
            </button>
            {(Object.keys(CATEGORY_MAP) as ExpenseCategory[]).map((cat) => {
              const CatIcon = CATEGORY_MAP[cat].icon;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium transition-colors whitespace-nowrap ${
                    categoryFilter === cat
                      ? "border-brand bg-brand-muted text-brand font-semibold"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <CatIcon size={13} className={categoryFilter === cat ? "text-brand" : "text-muted-foreground"} />
                  <span>{CATEGORY_MAP[cat].label}</span>
                </button>
              );
            })}
          </div>

          {/* Ringkasan Filter Terpilih */}
          <div className="flex items-center justify-between rounded-xl bg-card border border-border px-4 py-3">
            <span className="text-xs text-muted-foreground">
              Menampilkan{" "}
              <strong className="text-foreground">{filteredExpenses.length}</strong> catatan:
            </span>
            <div className="text-right">
              <span className="text-xs text-muted-foreground mr-2">Total Biaya:</span>
              <span className="font-heading text-sm font-bold text-foreground">
                {formatRupiah(totalFilteredAmount)}
              </span>
            </div>
          </div>

          {/* List Pengeluaran */}
          {loading ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Memuat data pengeluaran...
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <ReceiptIcon size={22} />
              </div>
              <h3 className="font-heading text-sm font-bold text-foreground">
                Belum ada catatan pengeluaran
              </h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                {searchQuery || categoryFilter !== "semua"
                  ? "Tidak ada pengeluaran yang cocok dengan filter atau pencarian Anda."
                  : "Mulai catat pengeluaran seperti token listrik induk, tagihan PDAM, atau biaya servis."}
              </p>
              {isAdmin && !searchQuery && categoryFilter === "semua" && (
                <button
                  onClick={() => {
                    setExpenseToEdit(null);
                    setIsFormOpen(true);
                  }}
                  className="btn-brand mt-4 px-4 py-2 text-xs font-semibold shadow-xs"
                >
                  + Catat Pengeluaran Pertama
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredExpenses.map((exp) => {
                const catInfo = CATEGORY_MAP[exp.category] || CATEGORY_MAP.lainnya;
                const room = exp.room_id ? roomById.get(exp.room_id) : null;
                const CatIcon = catInfo.icon;

                return (
                  <div
                    key={exp.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 transition-all hover:border-brand/30 hover:shadow-xs"
                  >
                    {/* Left Info */}
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${catInfo.bgClass}`}
                      >
                        <CatIcon size={18} className={catInfo.colorClass} />
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${catInfo.bgClass} ${catInfo.colorClass}`}
                          >
                            {catInfo.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatTanggal(exp.expense_date)}
                          </span>
                          {room && (
                            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                              Kamar {room.room_number}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                          {exp.description}
                        </p>
                      </div>
                    </div>

                    {/* Right Amount & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                      <span className="font-heading text-base font-bold text-foreground">
                        {formatRupiah(exp.amount)}
                      </span>

                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setExpenseToEdit(exp);
                              setIsFormOpen(true);
                            }}
                            aria-label="Edit Pengeluaran"
                            title="Edit Pengeluaran"
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors touch-manipulation"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="h-4 w-4"
                            >
                              <path d="m2.695 14.762-1.262 3.155a.5.5 0 0 0 .65.65l3.155-1.262a4 4 0 0 0 1.343-.882L17.5 5.501a2.121 2.121 0 0 0-3-3L3.577 13.419a4 4 0 0 0-.882 1.343Z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => setExpenseToDelete(exp)}
                            aria-label="Hapus Pengeluaran"
                            title="Hapus Pengeluaran"
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-status-terisi-bg hover:text-status-terisi transition-colors touch-manipulation"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="h-4 w-4"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: LAPORAN LABA-RUGI KASAR */}
      {/* ==================================================================== */}
      {activeTab === "labarugi" && (
        <div className="space-y-6">
          {/* Filter Bulan & Tahun */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border">
            <div className="flex items-center gap-3">
              <label htmlFor="select_bulan" className="text-xs font-semibold text-muted-foreground">
                Periode Laporan:
              </label>
              <select
                id="select_bulan"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground focus:border-brand focus:outline-none"
              >
                {NAMA_BULAN.map((m, idx) => (
                  <option key={idx} value={idx}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground focus:border-brand focus:outline-none"
              >
                {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Tombol-Tombol Aksi Laporan */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Tombol Unduh CSV / Excel */}
              <button
                onClick={() => {
                  const periodeNama = `${NAMA_BULAN[selectedMonth]} ${selectedYear}`;
                  const targetPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;
                  const monthlyP = payments.filter((p) => {
                    const dt = p.paid_date || p.due_date;
                    return dt.startsWith(targetPrefix);
                  });
                  exportLaporanBulananCsv(
                    periodeNama,
                    pnlData,
                    monthlyP,
                    pnlData.monthlyExpenses,
                    tenantById,
                    roomById
                  );
                  showToast("File Excel/CSV Laporan Keuangan berhasil diunduh!");
                }}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-xs"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4 text-emerald-600"
                >
                  <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
                  <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
                </svg>
                <span>Unduh Excel</span>
              </button>

              {/* Tombol Cetak PDF */}
              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-xs"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4 text-brand"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 2.75C5 1.784 5.784 1 6.75 1h6.5c.966 0 1.75.784 1.75 1.75v3.5A1.75 1.75 0 0 1 16.75 8H17a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-1.25V18.25A1.75 1.75 0 0 1 14 20H6a1.75 1.75 0 0 1-1.75-1.75V16H3a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h.25A1.75 1.75 0 0 1 5 6.25v-3.5ZM6.5 2.5v3.75h7V2.5h-7ZM5 14.5v3.75h10V14.5H5Z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Cetak PDF</span>
              </button>

              {/* Tombol Salin Laporan WA */}
              <button
                onClick={handleCopySummaryWA}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-xs"
              >
                <WhatsAppIcon size={14} />
                <span>Salin WA</span>
              </button>
            </div>
          </div>

          {/* 4 Kartu Metrik Keuangan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Pemasukan Lunas */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">Pemasukan Lunas</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-status-kosong-bg text-status-kosong">
                  <CoinsIcon size={15} />
                </span>
              </div>
              <p className="font-heading text-2xl font-bold text-foreground">
                {formatRupiah(pnlData.totalRevenue)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Dari <strong className="text-foreground">{pnlData.revenueCount}</strong> transaksi lunas
              </p>
            </div>

            {/* Total Pengeluaran */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">Total Pengeluaran</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-status-terisi-bg text-status-terisi">
                  <ReceiptIcon size={15} />
                </span>
              </div>
              <p className="font-heading text-2xl font-bold text-foreground">
                {formatRupiah(pnlData.totalExpense)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Dari <strong className="text-foreground">{pnlData.expenseCount}</strong> catatan biaya
              </p>
            </div>

            {/* Keuntungan Bersih */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">Keuntungan Bersih</span>
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                    pnlData.netProfit >= 0
                      ? "bg-status-kosong-bg text-status-kosong"
                      : "bg-status-terisi-bg text-status-terisi"
                  }`}
                >
                  {pnlData.netProfit >= 0 ? (
                    <TrendingUpIcon size={15} />
                  ) : (
                    <TrendingDownIcon size={15} />
                  )}
                </span>
              </div>
              <p
                className={`font-heading text-2xl font-bold ${
                  pnlData.netProfit >= 0 ? "text-status-kosong" : "text-status-terisi"
                }`}
              >
                {formatRupiah(pnlData.netProfit)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Status:{" "}
                <span
                  className={`font-semibold ${
                    pnlData.netProfit >= 0 ? "text-status-kosong" : "text-status-terisi"
                  }`}
                >
                  {pnlData.netProfit >= 0 ? "Surplus (Untung)" : "Defisit (Minus)"}
                </span>
              </p>
            </div>

            {/* Margin Keuntungan */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">Margin Keuntungan</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-muted text-brand">
                  <BarChartIcon size={15} />
                </span>
              </div>
              <p className="font-heading text-2xl font-bold text-foreground">
                {pnlData.profitMargin.toFixed(1)}%
              </p>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-brand h-full rounded-full transition-all"
                  style={{
                    width: `${Math.max(0, Math.min(100, pnlData.profitMargin))}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Rincian Pengeluaran Berdasarkan Kategori */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Breakdown Kategori */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
              <h3 className="font-heading text-base font-bold text-foreground">
                Rincian Biaya per Kategori (
                {NAMA_BULAN[selectedMonth]} {selectedYear})
              </h3>

              <div className="space-y-3">
                {(Object.keys(CATEGORY_MAP) as ExpenseCategory[]).map((cat) => {
                  const catInfo = CATEGORY_MAP[cat];
                  const amount = pnlData.categoryTotals[cat] || 0;
                  const percentage =
                    pnlData.totalExpense > 0
                      ? Math.round((amount / pnlData.totalExpense) * 100)
                      : 0;

                  return (
                    <div key={cat} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-medium text-foreground">
                          <catInfo.icon size={14} className={catInfo.colorClass} />
                          <span>{catInfo.label}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-foreground mr-1.5">
                            {formatRupiah(amount)}
                          </span>
                          <span className="text-muted-foreground text-[11px]">
                            ({percentage}%)
                          </span>
                        </div>
                      </div>
                      {/* Bar indicator */}
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-brand h-full rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Grafik Perbandingan Bulanan (6 Bulan Terakhir) */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
              <h3 className="font-heading text-base font-bold text-foreground">
                Tren Pemasukan vs Pengeluaran (6 Bulan Terakhir)
              </h3>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="bulan"
                      stroke="#888888"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `${val / 1000000}M`}
                    />
                    <Tooltip
                      formatter={(val: any) => formatRupiah(Number(val))}
                      contentStyle={{
                        borderRadius: "12px",
                        backgroundColor: "#1c1917",
                        color: "#fff",
                        border: "none",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                    <Bar
                      dataKey="Pemasukan"
                      fill="#22c55e"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={30}
                    />
                    <Bar
                      dataKey="Pengeluaran"
                      fill="#f97316"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={30}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Form Tambah / Edit Pengeluaran */}
      <PengeluaranFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setExpenseToEdit(null);
        }}
        expenseToEdit={expenseToEdit}
        rooms={rooms}
        onSave={handleSaveExpense}
      />

      {/* Modal Lembar Cetak Laporan Keuangan A4 */}
      <LaporanPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        periode={`${NAMA_BULAN[selectedMonth]} ${selectedYear}`}
        summary={pnlData}
        monthlyPayments={payments.filter((p) => {
          const targetPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;
          const dt = p.paid_date || p.due_date;
          return dt.startsWith(targetPrefix);
        })}
        monthlyExpenses={pnlData.monthlyExpenses}
        tenantById={tenantById}
        roomById={roomById}
      />

      {/* Modal Konfirmasi Hapus */}
      <Modal
        isOpen={!!expenseToDelete}
        onClose={() => setExpenseToDelete(null)}
        title="Hapus Catatan Pengeluaran?"
        description="Data pengeluaran yang dihapus tidak dapat dikembalikan."
        maxWidth="sm"
      >
        <div className="space-y-4">
          {expenseToDelete && (
            <div className="rounded-xl bg-muted/50 p-3.5 text-xs space-y-1">
              <p className="font-semibold text-foreground">{expenseToDelete.description}</p>
              <p className="text-muted-foreground">
                Nominal: <strong className="text-foreground">{formatRupiah(expenseToDelete.amount)}</strong>
              </p>
              <p className="text-muted-foreground">
                Tanggal: {formatTanggal(expenseToDelete.expense_date)}
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setExpenseToDelete(null)}
              className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleDeleteExpense}
              className="rounded-xl bg-status-terisi px-4 py-2 text-xs font-semibold text-white hover:bg-status-terisi/90 disabled:opacity-50"
            >
              {isDeleting ? "Menghapus..." : "Ya, Hapus"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function PengeluaranPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-center text-xs text-muted-foreground">
          Memuat halaman pengeluaran...
        </div>
      }
    >
      <PengeluaranContent />
    </Suspense>
  );
}
