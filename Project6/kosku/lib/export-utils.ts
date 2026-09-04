import { Payment, Expense, Room, Tenant } from "@/types/database";
import { formatTanggal, formatRupiah } from "@/lib/utils";

/**
 * Konversi angka ke teks terbilang bahasa Indonesia.
 * Contoh: 1500000 -> "Satu Juta Lima Ratus Ribu Rupiah"
 */
export function terbilang(angka: number): string {
  if (angka === 0) return "Nol Rupiah";

  const satuan = [
    "",
    "Satu",
    "Dua",
    "Tiga",
    "Empat",
    "Lima",
    "Enam",
    "Tujuh",
    "Delapan",
    "Sembilan",
    "Sepuluh",
    "Sebelas",
  ];

  function rekursif(n: number): string {
    if (n < 12) return satuan[n];
    if (n < 20) return rekursif(n - 10) + " Belas";
    if (n < 100) return rekursif(Math.floor(n / 10)) + " Puluh " + rekursif(n % 10);
    if (n < 200) return "Seratus " + rekursif(n - 100);
    if (n < 1000) return rekursif(Math.floor(n / 100)) + " Ratus " + rekursif(n % 100);
    if (n < 2000) return "Seribu " + rekursif(n - 1000);
    if (n < 1000000) return rekursif(Math.floor(n / 1000)) + " Ribu " + rekursif(n % 1000);
    if (n < 1000000000)
      return rekursif(Math.floor(n / 1000000)) + " Juta " + rekursif(n % 1000000);
    if (n < 1000000000000)
      return rekursif(Math.floor(n / 1000000000)) + " Miliar " + rekursif(n % 1000000000);
    return "";
  }

  const hasil = rekursif(Math.abs(Math.floor(angka)))
    .replace(/\s+/g, " ")
    .trim();

  return `${hasil} Rupiah`;
}

/**
 * Generator download file CSV dengan UTF-8 BOM untuk kompatibilitas Excel Windows.
 */
export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csvContent = rows
    .map((row) =>
      row
        .map((cell) => {
          const str = String(cell ?? "");
          if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes(";")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(",")
    )
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Ekspor Laporan Bulanan Lengkap (Pemasukan, Pengeluaran, dan Laba Bersih)
 */
export function exportLaporanBulananCsv(
  periode: string,
  summary: {
    totalRevenue: number;
    totalExpense: number;
    netProfit: number;
    profitMargin: number;
  },
  monthlyPayments: Payment[],
  monthlyExpenses: Expense[],
  tenantById: Map<string, Tenant>,
  roomById: Map<string, Room>
) {
  const rows: (string | number)[][] = [
    ["LAPORAN PEMBUKUAN BULANAN KOSKU"],
    ["Periode", periode],
    ["Tanggal Cetak", new Date().toLocaleDateString("id-ID")],
    [],
    ["=== RINGKASAN LABA-RUGI ==="],
    ["Total Pemasukan (Lunas)", summary.totalRevenue],
    ["Total Pengeluaran Operasional", summary.totalExpense],
    ["Keuntungan Bersih (Laba)", summary.netProfit],
    ["Margin Keuntungan", `${summary.profitMargin.toFixed(1)}%`],
    ["Status", summary.netProfit >= 0 ? "SURPLUS (UNTUNG)" : "DEFISIT (MINUS)"],
    [],
    ["=== RINCIAN PEMASUKAN ==="],
    ["No", "Tanggal Bayar", "Nama Penghuni", "Kamar", "Jenis Tagihan", "Nominal (Rp)", "Metode"],
  ];

  let noPemasukan = 1;
  monthlyPayments.forEach((p) => {
    const tenant = tenantById.get(p.tenant_id);
    const room = roomById.get(p.room_id);
    rows.push([
      noPemasukan++,
      p.paid_date ? formatTanggal(p.paid_date) : "-",
      tenant?.full_name || "Penghuni",
      room ? `Kamar ${room.room_number}` : "-",
      p.payment_type.toUpperCase(),
      p.amount,
      p.payment_method || "Transfer",
    ]);
  });

  rows.push([]);
  rows.push(["=== RINCIAN PENGELUARAN OPERASIONAL ==="]);
  rows.push(["No", "Tanggal Biaya", "Kategori", "Keterangan", "Terkait Kamar", "Nominal (Rp)"]);

  let noPengeluaran = 1;
  monthlyExpenses.forEach((e) => {
    const room = e.room_id ? roomById.get(e.room_id) : null;
    rows.push([
      noPengeluaran++,
      formatTanggal(e.expense_date),
      e.category.toUpperCase(),
      e.description,
      room ? `Kamar ${room.room_number}` : "Umum / Seluruh Kos",
      e.amount,
    ]);
  });

  const cleanPeriode = periode.replace(/[\s/]/g, "_");
  downloadCsv(`Laporan_Keuangan_KosKu_${cleanPeriode}.csv`, rows);
}

/**
 * Ekspor Rekap Pembayaran Seluruh Penyewa
 */
export function exportPembayaranCsv(
  payments: Payment[],
  tenantById: Map<string, Tenant>,
  roomById: Map<string, Room>
) {
  const rows: (string | number)[][] = [
    ["REKAP DAFTAR PEMBAYARAN KOSKU"],
    ["Tanggal Unduh", new Date().toLocaleDateString("id-ID")],
    [],
    [
      "No",
      "Nama Penyewa",
      "Nomor HP",
      "Kamar",
      "Jenis Tagihan",
      "Nominal (Rp)",
      "Jatuh Tempo",
      "Tanggal Bayar",
      "Status",
      "Metode Bayar",
      "Catatan",
    ],
  ];

  payments.forEach((p, idx) => {
    const tenant = tenantById.get(p.tenant_id);
    const room = roomById.get(p.room_id);

    rows.push([
      idx + 1,
      tenant?.full_name || "Penyewa",
      tenant?.phone_number || "-",
      room ? `Kamar ${room.room_number}` : "-",
      p.payment_type.toUpperCase(),
      p.amount,
      formatTanggal(p.due_date),
      p.paid_date ? formatTanggal(p.paid_date) : "-",
      p.status.toUpperCase(),
      p.payment_method || "-",
      p.notes || "-",
    ]);
  });

  const todayStr = new Date().toISOString().split("T")[0];
  downloadCsv(`Rekap_Pembayaran_KosKu_${todayStr}.csv`, rows);
}

/**
 * Ekspor Catatan Pengeluaran Operasional
 */
export function exportPengeluaranCsv(
  expenses: Expense[],
  roomById: Map<string, Room>
) {
  const rows: (string | number)[][] = [
    ["REKAP PENGELUARAN OPERASIONAL KOSKU"],
    ["Tanggal Unduh", new Date().toLocaleDateString("id-ID")],
    [],
    ["No", "Tanggal Biaya", "Kategori", "Keterangan", "Alokasi Kamar", "Nominal (Rp)"],
  ];

  expenses.forEach((e, idx) => {
    const room = e.room_id ? roomById.get(e.room_id) : null;
    rows.push([
      idx + 1,
      formatTanggal(e.expense_date),
      e.category.toUpperCase(),
      e.description,
      room ? `Kamar ${room.room_number}` : "Operasional Umum",
      e.amount,
    ]);
  });

  const todayStr = new Date().toISOString().split("T")[0];
  downloadCsv(`Rekap_Pengeluaran_KosKu_${todayStr}.csv`, rows);
}

/**
 * Ekspor Rekap Daftar Seluruh Penyewa (Aktif & Alumni)
 */
export function exportPenyewaCsv(
  tenants: Tenant[],
  roomById: Map<string, Room>
) {
  const rows: (string | number)[][] = [
    ["REKAP DAFTAR PENYEWA KOSKU"],
    ["Tanggal Unduh", new Date().toLocaleDateString("id-ID")],
    [],
    [
      "No",
      "Nama Penyewa",
      "Status",
      "Kamar Dihuni",
      "Nomor HP / WhatsApp",
      "Nomor Identitas (KTP)",
      "Tanggal Masuk",
      "Tanggal Keluar",
      "Siklus Sewa",
    ],
  ];

  tenants.forEach((t, idx) => {
    const room = t.room_id ? roomById.get(t.room_id) : null;
    rows.push([
      idx + 1,
      t.full_name,
      t.is_active ? "AKTIF" : "ALUMNI (SUDAH KELUAR)",
      room ? `Kamar ${room.room_number}` : "-",
      t.phone_number || "-",
      t.id_number || "-",
      t.move_in_date ? formatTanggal(t.move_in_date) : "-",
      t.move_out_date ? formatTanggal(t.move_out_date) : "-",
      t.rent_cycle ? t.rent_cycle.toUpperCase() : "BULANAN",
    ]);
  });

  const todayStr = new Date().toISOString().split("T")[0];
  downloadCsv(`Rekap_Penyewa_KosKu_${todayStr}.csv`, rows);
}

