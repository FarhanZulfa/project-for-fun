"use client";

import { useState, useMemo } from "react";
import { Room, RoomType, RoomStatus } from "@/types/database";
import { formatRupiah } from "@/lib/utils";
import {
  AcIcon,
  FanIcon,
  BedIcon,
  DoorIcon,
  DeskIcon,
  WifiIcon,
  WhatsAppIcon,
  CheckIcon,
  SparklesIcon,
  CheckCircleIcon,
  WrenchIcon,
} from "@/components/shared/icons";

interface KamarKatalogPublikProps {
  rooms: Room[];
  ownerPhone?: string;
}

export function KamarKatalogPublik({
  rooms,
  ownerPhone = "6281234567890",
}: KamarKatalogPublikProps) {
  const [filterType, setFilterType] = useState<"semua" | RoomType>("semua");
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(true);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Kamar terfilter
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      if (filterType !== "semua" && r.room_type !== filterType) {
        return false;
      }
      if (onlyAvailable && r.status !== "kosong") {
        return false;
      }
      return true;
    });
  }, [rooms, filterType, onlyAvailable]);

  // Statistik Ketersediaan
  const availableCount = useMemo(() => {
    return rooms.filter((r) => r.status === "kosong").length;
  }, [rooms]);

  function getWhatsAppBookingUrl(room: Room) {
    const cleanPhone = ownerPhone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : cleanPhone;
    const typeLabel = room.room_type === "ac" ? "AC" : "Kipas";
    const text = `Halo Pengelola KosKu, saya tertarik ingin survey / booking Kamar ${room.room_number} (Tipe ${typeLabel}, ${formatRupiah(room.monthly_price)}/bulan). Apakah kamar ini masih tersedia? Kapan waktu yang tepat untuk survey? Terima kasih! 🙏`;
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
  }

  return (
    <div id="katalog" className="scroll-mt-20 space-y-6">
      {/* Header Katalog */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-status-kosong-bg px-3 py-1 text-xs font-semibold text-status-kosong mb-2">
            <span className="h-2 w-2 rounded-full bg-status-kosong" />
            <span>Tersedia {availableCount} Kamar Siap Huni dari Total {rooms.length} Kamar</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Pilihan Kamar Kos
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Kamar bersih, tenang, pencahayaan alami, dan siap huni kapan saja.
          </p>
        </div>

        {/* Filter Bar Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Tipe */}
          <div className="flex rounded-xl bg-muted/60 p-1 border border-border">
            <button
              type="button"
              onClick={() => setFilterType("semua")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all touch-manipulation ${
                filterType === "semua"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Semua Tipe
            </button>
            <button
              type="button"
              onClick={() => setFilterType("ac")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all touch-manipulation ${
                filterType === "ac"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <AcIcon size={14} />
              <span>Tipe AC</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType("kipas")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all touch-manipulation ${
                filterType === "kipas"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FanIcon size={14} />
              <span>Tipe Kipas</span>
            </button>
          </div>

          {/* Toggle Hanya Kamar Kosong */}
          <button
            type="button"
            onClick={() => setOnlyAvailable(!onlyAvailable)}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all touch-manipulation ${
              onlyAvailable
                ? "border-status-kosong/40 bg-status-kosong-bg text-status-kosong"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                onlyAvailable
                  ? "border-status-kosong bg-status-kosong text-white"
                  : "border-border bg-muted/40"
              }`}
            >
              {onlyAvailable && <CheckIcon size={10} />}
            </span>
            <span>Hanya Kamar Kosong</span>
          </button>
        </div>
      </div>

      {/* Grid Kamar Publik */}
      {filteredRooms.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <DoorIcon size={24} />
          </div>
          <h3 className="font-heading text-base font-bold text-foreground">
            Tidak ada kamar yang sesuai filter
          </h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            {onlyAvailable
              ? "Semua kamar pada kategori ini saat ini sedang terisi. Anda dapat menonaktifkan filter ketersediaan atau menghubungi pengelola untuk masuk daftar tunggu."
              : "Belum ada kamar yang cocok dengan kriteria filter yang dipilih."}
          </p>
          <button
            type="button"
            onClick={() => {
              setFilterType("semua");
              setOnlyAvailable(false);
            }}
            className="btn-brand mt-4 px-4 py-2 text-xs"
          >
            Tampilkan Semua Kamar
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRooms.map((room) => {
            const isKosong = room.status === "kosong";
            const waBookingUrl = getWhatsAppBookingUrl(room);

            return (
              <div
                key={room.id}
                className={`group flex flex-col justify-between rounded-2xl border bg-card p-5 shadow-xs transition-all hover:shadow-md hover:border-brand/40 ${
                  isKosong
                    ? "border-status-kosong/40 ring-1 ring-status-kosong/10"
                    : "border-border opacity-85"
                }`}
              >
                <div>
                  {/* Atas: Nomor Kamar & Badge Tipe */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-heading text-2xl font-bold tracking-tight text-foreground group-hover:text-brand transition-colors">
                        Kamar {room.room_number}
                      </h3>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
                            room.room_type === "ac"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {room.room_type === "ac" ? (
                            <>
                              <AcIcon size={12} />
                              <span>Tipe AC</span>
                            </>
                          ) : (
                            <>
                              <FanIcon size={12} />
                              <span>Tipe Kipas</span>
                            </>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">Lantai {room.room_number.startsWith("2") ? "2" : "1"}</span>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        isKosong
                          ? "badge-kosong"
                          : room.status === "terisi"
                          ? "bg-muted text-muted-foreground"
                          : "badge-maintenance"
                      }`}
                    >
                      {isKosong ? (
                        <>
                          <CheckCircleIcon size={13} className="text-status-kosong" />
                          <span>Siap Huni</span>
                        </>
                      ) : room.status === "terisi" ? (
                        <span>Terisi</span>
                      ) : (
                        <>
                          <WrenchIcon size={12} />
                          <span>Perbaikan</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Harga Bulanan */}
                  <div className="mt-4 pb-3 border-b border-border/60">
                    <div className="flex items-baseline gap-1">
                      <span className="font-heading text-2xl font-extrabold text-foreground tabular-nums">
                        {formatRupiah(room.monthly_price)}
                      </span>
                      <span className="text-xs text-muted-foreground"> / bulan</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground block mt-0.5">
                      Sudah termasuk air & WiFi bersama
                    </span>
                  </div>

                  {/* Fasilitas Kamar */}
                  <div className="mt-3 space-y-1.5 text-xs text-foreground/80">
                    <div className="flex items-center gap-2">
                      <BedIcon size={14} className="text-brand shrink-0" />
                      <span>Kasur springbed empuk + bantal</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DoorIcon size={14} className="text-brand shrink-0" />
                      <span>Lemari pakaian & cermin</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DeskIcon size={14} className="text-brand shrink-0" />
                      <span>Meja & kursi belajar/kerja</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <WifiIcon size={14} className="text-brand shrink-0" />
                      <span>WiFi internet cepat gratis</span>
                    </div>
                    {room.notes && (
                      <p className="mt-2 text-[11px] text-muted-foreground italic bg-muted/30 p-2 rounded-lg border border-border/40">
                        &quot;{room.notes}&quot;
                      </p>
                    )}
                  </div>
                </div>

                {/* Tombol Aksi Kontak WA */}
                <div className="mt-5 pt-3 border-t border-border">
                  {isKosong ? (
                    <a
                      href={waBookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors touch-manipulation"
                    >
                      <WhatsAppIcon size={15} />
                      <span>Survey / Booking via WA</span>
                    </a>
                  ) : (
                    <a
                      href={`https://wa.me/${ownerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
                        `Halo Pengelola KosKu, saya ingin tanya perkiraan kapan Kamar ${room.room_number} akan kosong kembali? Terima kasih.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors touch-manipulation"
                    >
                      <WhatsAppIcon size={14} className="text-muted-foreground" />
                      <span>Tanya Antrean Kamar</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
