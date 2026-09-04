"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Room, Tenant, Payment, PaymentStatus } from "@/types/database";
import { formatRupiah, formatTanggal, hitungSelisihHari } from "@/lib/utils";
import { PublicHeader } from "@/components/public/public-header";
import { PublicFooter } from "@/components/public/public-footer";
import { KuitansiModal } from "@/components/pembayaran/kuitansi-modal";
import Link from "next/link";
import {
  BankIcon,
  ReceiptIcon,
  WhatsAppIcon,
  CopyIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ClockIcon,
  KeyIcon,
  CheckIcon,
  CreditCardIcon,
  ArrowRightIcon,
} from "@/components/shared/icons";

export default function CekTagihanPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Kuitansi modal state
  const [isKuitansiOpen, setIsKuitansiOpen] = useState(false);
  const [selectedPaymentForKuitansi, setSelectedPaymentForKuitansi] = useState<Payment | null>(null);

  const supabase = createClient();

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 3500);
  }

  // Load Data Publik
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [
          { data: roomsData },
          { data: tenantsData },
          { data: paymentsData },
        ] = await Promise.all([
          supabase.from("rooms").select("*").order("room_number", { ascending: true }),
          supabase.from("tenants").select("*").eq("is_active", true),
          supabase.from("payments").select("*").order("due_date", { ascending: false }),
        ]);

        const sortedRooms = (roomsData || []).sort((a, b) =>
          a.room_number.localeCompare(b.room_number, undefined, { numeric: true })
        );

        setRooms(sortedRooms);
        setTenants(tenantsData || []);

        const todayStr = new Date().toISOString().split("T")[0];
        const normalizedPayments = (paymentsData || []).map((p) => {
          if (p.status === "belum_bayar" && p.due_date < todayStr) {
            return { ...p, status: "telat" as PaymentStatus };
          }
          return p;
        });
        setPayments(normalizedPayments);
      } catch (err: any) {
        console.error("Gagal memuat data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const selectedRoom = useMemo(() => {
    return rooms.find((r) => r.id === selectedRoomId) || null;
  }, [rooms, selectedRoomId]);

  const activeTenantInRoom = useMemo(() => {
    if (!selectedRoomId) return null;
    return tenants.find((t) => t.room_id === selectedRoomId && t.is_active) || null;
  }, [tenants, selectedRoomId]);

  const roomPayments = useMemo(() => {
    if (!selectedRoomId) return [];
    return payments.filter((p) => p.room_id === selectedRoomId);
  }, [payments, selectedRoomId]);

  function copyText(text: string, label: string) {
    navigator.clipboard.writeText(text);
    showToast(`${label} disalin ke clipboard`);
  }

  function getConfirmWAUrl(p?: Payment) {
    const roomNum = selectedRoom?.room_number || "";
    const billType = p ? p.payment_type.toUpperCase() : "SEWA / LISTRIK";
    const nominal = p ? formatRupiah(p.amount) : "";
    const text = `Halo Pengelola KosKu, saya penghuni Kamar ${roomNum} ingin konfirmasi pembayaran ${billType} ${nominal ? `sebesar ${nominal}` : ""}. Berikut bukti transfernya terlampir. Mohon diverifikasi ya, terima kasih! 🙏`;
    return `https://wa.me/6281234567890?text=${encodeURIComponent(text)}`;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-brand/20">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-foreground px-4 py-3 text-xs font-semibold text-background shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2">
          <CheckIcon size={14} className="text-status-kosong" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Publik */}
      <PublicHeader />

      <main className="flex-1 mx-auto max-w-4xl w-full px-4 sm:px-6 py-10 sm:py-16 space-y-8">
        {/* Header Portal */}
        <div className="max-w-xl mx-auto text-center space-y-2">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Cek Status Tagihan Kamar
          </h1>
          <p className="text-sm text-muted-foreground">
            Pilih nomor kamar Anda untuk melihat rincian tagihan sewa, pemakaian listrik, dan nomor rekening pembayaran resmi pengelola.
          </p>
        </div>

        {/* Pemilihan Kamar */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-4">
          <label htmlFor="pilih-kamar" className="block text-sm font-bold text-foreground">
            Pilih Nomor Kamar Anda:
          </label>
          <select
            id="pilih-kamar"
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base font-semibold text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          >
            <option value="">-- Pilih Kamar Anda (Contoh: Kamar 101) --</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                Kamar {room.room_number} ({room.room_type === "ac" ? "Tipe AC" : "Tipe Kipas"}) • {formatRupiah(room.monthly_price)}/bln
              </option>
            ))}
          </select>

          {selectedRoom && (
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-2">
              <span>
                Kamar: <strong className="text-foreground">Kamar {selectedRoom.room_number}</strong> ({selectedRoom.room_type.toUpperCase()})
              </span>
              <span>
                Tarif Bulanan: <strong className="text-foreground">{formatRupiah(selectedRoom.monthly_price)}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Konten Rincian Tagihan */}
        {selectedRoomId ? (
          <div className="space-y-6">
            {/* Daftar Tagihan */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-5">
              <div>
                <h3 className="font-heading text-xl font-bold text-foreground">
                  Riwayat Tagihan & Pembayaran
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Catatan tagihan sewa kamar, listrik, dan air untuk Kamar {selectedRoom?.room_number}
                </p>
              </div>

              {loading ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Memuat data tagihan...
                </div>
              ) : roomPayments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-8 text-center bg-muted/20">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-status-kosong-bg text-status-kosong">
                    <CheckCircleIcon size={20} />
                  </div>
                  <h4 className="font-semibold text-sm text-foreground">
                    Tidak ada tagihan tertunda
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Semua tagihan untuk kamar ini telah lunas atau belum ada tagihan baru yang diterbitkan.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {roomPayments.map((p) => {
                    const selisih = hitungSelisihHari(p.due_date);
                    const isLunas = p.status === "lunas";
                    const isTelat = p.status === "telat";

                    return (
                      <div
                        key={p.id}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all gap-3 ${
                          isLunas
                            ? "bg-card border-border hover:border-status-kosong/40"
                            : isTelat
                            ? "bg-status-terisi-bg border-status-terisi/40"
                            : "bg-card border-status-maintenance/40"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                                p.payment_type === "sewa"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : p.payment_type === "listrik"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-cyan-50 text-cyan-700 border border-cyan-200"
                              }`}
                            >
                              Tagihan {p.payment_type}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                isLunas
                                  ? "badge-kosong"
                                  : isTelat
                                  ? "badge-terisi"
                                  : "badge-maintenance"
                              }`}
                            >
                              {isLunas ? (
                                <>
                                  <CheckCircleIcon size={12} className="text-status-kosong" />
                                  <span>Lunas</span>
                                </>
                              ) : isTelat ? (
                                <>
                                  <AlertCircleIcon size={12} className="text-status-terisi" />
                                  <span>Terlambat</span>
                                </>
                              ) : (
                                <>
                                  <ClockIcon size={12} className="text-status-maintenance" />
                                  <span>Belum Bayar</span>
                                </>
                              )}
                            </span>
                          </div>

                          <p className="font-heading text-lg font-bold text-foreground tabular-nums">
                            {formatRupiah(p.amount)}
                          </p>

                          <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                            {isLunas ? (
                              <span>
                                Dilunasi: <strong>{p.paid_date ? formatTanggal(p.paid_date) : "-"}</strong> ({p.payment_method || "Transfer"})
                              </span>
                            ) : (
                              <span>
                                Jatuh Tempo: <strong>{formatTanggal(p.due_date)}</strong>
                                {selisih >= 0 ? (
                                  <span className="ml-1 text-status-maintenance font-semibold">
                                    ({selisih === 0 ? "Hari ini!" : `${selisih} hari lagi`})
                                  </span>
                                ) : (
                                  <span className="ml-1 text-status-terisi font-semibold">
                                    (Lewat {Math.abs(selisih)} hari)
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Tombol Aksi */}
                        <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
                          {isLunas ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPaymentForKuitansi(p);
                                setIsKuitansiOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-2xs"
                            >
                              <ReceiptIcon size={14} className="text-muted-foreground" />
                              <span>Lihat Kuitansi</span>
                            </button>
                          ) : (
                            <a
                              href={getConfirmWAUrl(p)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-2xs"
                            >
                              <WhatsAppIcon size={14} />
                              <span>Konfirmasi Transfer</span>
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Rekening Pembayaran Resmi */}
            <div className="rounded-2xl border border-brand/20 bg-card p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <BankIcon size={18} />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-foreground">
                    Rekening Pembayaran Resmi KosKu
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Harap transfer hanya ke rekening bank resmi pengelola di bawah ini:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Bank BCA */}
                <div className="rounded-xl border border-border bg-card p-4 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      Bank BCA
                    </span>
                    <button
                      type="button"
                      onClick={() => copyText("1234567890", "No Rekening BCA")}
                      className="inline-flex items-center gap-1 text-xs text-brand font-semibold hover:underline"
                    >
                      <CopyIcon size={13} />
                      <span>Salin</span>
                    </button>
                  </div>
                  <p className="font-heading text-xl font-bold tracking-wider text-foreground tabular-nums">
                    1234 567 890
                  </p>
                  <span className="text-xs text-muted-foreground block">
                    a.n. Pengelola KosKu
                  </span>
                </div>

                {/* Bank Mandiri */}
                <div className="rounded-xl border border-border bg-card p-4 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Bank Mandiri
                    </span>
                    <button
                      type="button"
                      onClick={() => copyText("1350012345678", "No Rekening Mandiri")}
                      className="inline-flex items-center gap-1 text-xs text-brand font-semibold hover:underline"
                    >
                      <CopyIcon size={13} />
                      <span>Salin</span>
                    </button>
                  </div>
                  <p className="font-heading text-xl font-bold tracking-wider text-foreground tabular-nums">
                    135-00-1234567-8
                  </p>
                  <span className="text-xs text-muted-foreground block">
                    a.n. Pengelola KosKu
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground border-t border-border/60">
                <span>
                  Setelah transfer, lampirkan bukti struk atau screenshot via WhatsApp pengelola.
                </span>
                <a
                  href={getConfirmWAUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-bold text-emerald-700 hover:underline shrink-0"
                >
                  <WhatsAppIcon size={14} />
                  <span>Kirim Bukti ke WhatsApp</span>
                  <ArrowRightIcon size={13} />
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <KeyIcon size={22} />
            </div>
            <h3 className="font-heading text-lg font-bold text-foreground">
              Silakan Pilih Kamar Anda di Atas
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Informasi tagihan sewa, pemakaian listrik, air, dan nomor rekening pembayaran akan langsung ditampilkan secara instan.
            </p>
          </div>
        )}

        {/* Modal Kuitansi Resmi */}
        <KuitansiModal
          isOpen={isKuitansiOpen}
          onClose={() => setIsKuitansiOpen(false)}
          payment={selectedPaymentForKuitansi}
          tenant={activeTenantInRoom}
          room={selectedRoom}
        />
      </main>

      {/* Footer Publik */}
      <PublicFooter />
    </div>
  );
}
