"use client";

import { useState } from "react";
import { Room, RoomStatus, Tenant, Expense } from "@/types/database";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import { Modal } from "@/components/shared/modal";
import Link from "next/link";
import {
  FileTextIcon,
  UsersIcon,
  WrenchIcon,
  WhatsAppIcon,
  CalendarIcon,
} from "@/components/shared/icons";

interface KamarDetailModalProps {
  room: Room | null;
  tenant?: Tenant | null;
  allRoomTenants?: Tenant[];
  roomExpenses?: Expense[];
  isAdmin?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (room: Room) => void;
  onDelete: (room: Room) => void;
  onStatusChange: (room: Room, newStatus: RoomStatus) => void;
}

function hitungDurasiSewa(moveIn: string, moveOut?: string | null): string {
  try {
    const start = new Date(moveIn);
    const end = moveOut ? new Date(moveOut) : new Date();
    const diffDays = Math.max(
      1,
      Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    );
    if (diffDays < 30) {
      return `${diffDays} hari`;
    }
    const months = Math.round(diffDays / 30);
    return `${months} bulan`;
  } catch {
    return "-";
  }
}

export function KamarDetailModal({
  room,
  tenant,
  allRoomTenants = [],
  roomExpenses = [],
  isAdmin = true,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
}: KamarDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"info" | "histori" | "servis">("info");

  if (!room) return null;

  const statusConfig: Record<
    RoomStatus,
    { label: string; badgeClass: string; desc: string }
  > = {
    kosong: {
      label: "Kosong",
      badgeClass: "badge-kosong",
      desc: "Kamar bersih dan siap ditempati penyewa baru.",
    },
    terisi: {
      label: "Terisi",
      badgeClass: "badge-terisi",
      desc: "Kamar sedang dihuni oleh penyewa aktif.",
    },
    maintenance: {
      label: "Perbaikan",
      badgeClass: "badge-maintenance",
      desc: "Kamar dalam perbaikan fasilitas atau renovasi.",
    },
  };

  const statusInfo = statusConfig[room.status] || statusConfig.kosong;

  // Format link WhatsApp jika nomor HP penyewa aktif tersedia
  const waUrl = tenant?.phone_number
    ? `https://wa.me/${tenant.phone_number.replace(/\D/g, "")}?text=Halo%20${encodeURIComponent(
        tenant.full_name
      )},%20mengenai%20kamar%20${encodeURIComponent(room.room_number)}...`
    : null;

  // Total biaya servis kamar ini
  const totalBiayaServis = roomExpenses.reduce((acc, curr) => acc + Number(curr.amount), 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Kamar ${room.room_number}`}
      description={`Tipe ${room.room_type === "ac" ? "AC" : "Kipas"} • ${formatRupiah(
        room.monthly_price
      )}/bulan`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Navigasi Sub-Tab Detail Kamar */}
        <div role="tablist" aria-label="Menu Detail Kamar" className="flex border-b border-border text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "info"}
            onClick={() => setActiveTab("info")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 min-h-[40px] transition-colors whitespace-nowrap touch-manipulation ${
              activeTab === "info"
                ? "border-brand text-brand font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileTextIcon size={14} />
            <span>Info Kamar</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "histori"}
            onClick={() => setActiveTab("histori")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 min-h-[40px] transition-colors whitespace-nowrap touch-manipulation ${
              activeTab === "histori"
                ? "border-brand text-brand font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <UsersIcon size={14} />
            <span>Riwayat Penghuni ({allRoomTenants.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "servis"}
            onClick={() => setActiveTab("servis")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 min-h-[40px] transition-colors whitespace-nowrap touch-manipulation ${
              activeTab === "servis"
                ? "border-brand text-brand font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <WrenchIcon size={14} />
            <span>Riwayat Servis ({roomExpenses.length})</span>
          </button>
        </div>

        {/* ==================================================================== */}
        {/* TAB 1: INFO KAMAR & STATUS */}
        {/* ==================================================================== */}
        {activeTab === "info" && (
          <div className="space-y-4">
            {/* Status Saat Ini & Pilihan Cepat */}
            <div className="rounded-2xl bg-card border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status Kamar
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusInfo.badgeClass}`}
                >
                  {statusInfo.label}
                </span>
              </div>

              <p className="text-xs text-muted-foreground mb-3">{statusInfo.desc}</p>

              {/* Tombol Cepat Ubah Status (Khusus Admin) */}
              {isAdmin && (
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => onStatusChange(room, "kosong")}
                    className={`flex flex-col items-center justify-center rounded-xl p-2.5 text-xs font-medium transition-all ${
                      room.status === "kosong"
                        ? "bg-status-kosong text-white shadow-xs ring-2 ring-status-kosong/30"
                        : "bg-status-kosong-bg text-status-kosong hover:bg-status-kosong/20"
                    }`}
                  >
                    <span className="font-semibold">Kosong</span>
                    <span className="text-[10px] opacity-80">Siap huni</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onStatusChange(room, "terisi")}
                    className={`flex flex-col items-center justify-center rounded-xl p-2.5 text-xs font-medium transition-all ${
                      room.status === "terisi"
                        ? "bg-status-terisi text-white shadow-xs ring-2 ring-status-terisi/30"
                        : "bg-status-terisi-bg text-status-terisi hover:bg-status-terisi/20"
                    }`}
                  >
                    <span className="font-semibold">Terisi</span>
                    <span className="text-[10px] opacity-80">Ada penyewa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onStatusChange(room, "maintenance")}
                    className={`flex flex-col items-center justify-center rounded-xl p-2.5 text-xs font-medium transition-all ${
                      room.status === "maintenance"
                        ? "bg-status-maintenance text-white shadow-xs ring-2 ring-status-maintenance/30"
                        : "bg-status-maintenance-bg text-status-maintenance hover:bg-status-maintenance/20"
                    }`}
                  >
                    <span className="font-semibold">Perbaikan</span>
                    <span className="text-[10px] opacity-80">Renovasi/Servis</span>
                  </button>
                </div>
              )}
            </div>

            {/* Informasi Penghuni Aktif */}
            <div className="rounded-2xl bg-card border border-border p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Penghuni Aktif Saat Ini
              </h3>

              {tenant ? (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-base text-foreground">
                        {tenant.full_name}
                      </h4>
                      {tenant.phone_number && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          No. WhatsApp: {tenant.phone_number}
                        </p>
                      )}
                      {tenant.move_in_date && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Mulai Sewa: {formatTanggal(tenant.move_in_date)} (
                          {hitungDurasiSewa(tenant.move_in_date)})
                        </p>
                      )}
                    </div>

                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors shadow-xs"
                      >
                        <WhatsAppIcon size={13} />
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>

                  <div className="pt-2 border-t border-border/50 flex justify-end">
                    <Link
                      href={`/penyewa`}
                      className="text-xs font-medium text-brand hover:underline"
                    >
                      Kelola Profil Penyewa Ini →
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-3 text-xs text-muted-foreground">
                  <p>Kamar ini sedang tidak berpenghuni.</p>
                  <Link
                    href={`/penyewa?tambah=true&room_id=${room.id}`}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                  >
                    + Daftarkan Penghuni Baru
                  </Link>
                </div>
              )}
            </div>

            {/* Catatan / Fasilitas Kamar */}
            <div className="rounded-2xl bg-card border border-border p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Catatan Fasilitas & Lokasi
              </h3>
              <p className="text-xs text-foreground/90 whitespace-pre-line leading-relaxed">
                {room.notes ? room.notes : "Belum ada catatan khusus untuk kamar ini."}
              </p>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: RIWAYAT & HISTORI PENGHUNI KAMAR */}
        {/* ==================================================================== */}
        {activeTab === "histori" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Linimasa riwayat seluruh penghuni yang pernah menyewa Kamar {room.room_number}:
            </p>

            {allRoomTenants.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-xs text-muted-foreground">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <UsersIcon size={20} />
                </div>
                <p className="font-semibold text-foreground">Belum ada riwayat penghuni</p>
                <p className="mt-0.5">
                  Belum ada catatan penghuni yang terdaftar di kamar ini sebelumnya.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {allRoomTenants.map((t, idx) => {
                  const isActive = t.is_active;
                  const durasi = hitungDurasiSewa(t.move_in_date, t.move_out_date);

                  return (
                    <div
                      key={t.id}
                      className={`rounded-2xl border p-3.5 text-xs transition-all ${
                        isActive
                          ? "border-status-kosong/40 bg-status-kosong-bg/20"
                          : "border-border bg-card"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-foreground">
                              {t.full_name}
                            </span>
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                isActive
                                  ? "bg-status-kosong text-white"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {isActive ? "Penghuni Aktif" : "Alumni"}
                            </span>
                          </div>

                          <p className="text-muted-foreground mt-1 flex items-center gap-1.5">
                            <CalendarIcon size={12} className="text-muted-foreground shrink-0" />
                            <span>
                              {formatTanggal(t.move_in_date)} —{" "}
                              {t.move_out_date ? formatTanggal(t.move_out_date) : "Sekarang"}
                            </span>
                            <span className="font-medium text-foreground">
                              ({durasi})
                            </span>
                          </p>

                          {t.phone_number && (
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Telp: {t.phone_number}
                            </p>
                          )}
                        </div>

                        {t.phone_number && (
                          <a
                            href={`https://wa.me/${t.phone_number.replace(
                              /\D/g,
                              ""
                            )}?text=Halo%20${encodeURIComponent(t.full_name)}...`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-green-600 transition-colors"
                            title="Chat WhatsApp"
                          >
                            <WhatsAppIcon size={14} />
                          </a>
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
        {/* TAB 3: RIWAYAT SERVIS & BIAYA PERBAIKAN KAMAR */}
        {/* ==================================================================== */}
        {activeTab === "servis" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Total Biaya Perbaikan Kamar {room.room_number}:
              </span>
              <span className="font-heading font-bold text-sm text-foreground">
                {formatRupiah(totalBiayaServis)}
              </span>
            </div>

            {roomExpenses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-xs text-muted-foreground">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <WrenchIcon size={20} />
                </div>
                <p className="font-semibold text-foreground">Belum ada catatan servis</p>
                <p className="mt-0.5">
                  Kamar ini belum pernah dicatat memiliki pengeluaran perbaikan atau servis AC.
                </p>
                <Link
                  href="/pengeluaran"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                >
                  Catat Pengeluaran untuk Kamar Ini →
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {roomExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {exp.description}
                        </span>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground uppercase">
                          {exp.category}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-[11px] mt-0.5">
                        {formatTanggal(exp.expense_date)}
                      </p>
                    </div>

                    <span className="font-heading font-bold text-sm text-status-terisi shrink-0">
                      {formatRupiah(exp.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer Tombol Aksi (Edit & Hapus) */}
        <div className="pt-3 border-t border-border flex items-center justify-between gap-3">
          {isAdmin ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onDelete(room);
              }}
              disabled={!!tenant}
              title={
                tenant
                  ? "Tidak bisa menghapus kamar yang sedang terisi penyewa"
                  : "Hapus kamar ini"
              }
              className="rounded-xl px-3.5 py-2 text-xs font-semibold text-destructive hover:bg-status-terisi-bg disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            >
              Hapus Kamar
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Tutup
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(room);
                }}
                className="btn-brand px-4 py-2 text-xs font-semibold shadow-xs"
              >
                Edit Kamar
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
