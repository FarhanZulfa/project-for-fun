"use client";

import { Room, RoomStatus, Tenant } from "@/types/database";
import { formatRupiah } from "@/lib/utils";
import { AcIcon, FanIcon, WrenchIcon } from "@/components/shared/icons";

interface KamarCardProps {
  room: Room;
  tenant?: Tenant | null;
  isAdmin?: boolean;
  onSelect: (room: Room) => void;
  onQuickStatusChange: (room: Room, newStatus: RoomStatus) => void;
}

export function KamarCard({
  room,
  tenant,
  isAdmin = true,
  onSelect,
  onQuickStatusChange,
}: KamarCardProps) {
  // Status label & badge style
  const statusConfig: Record<
    RoomStatus,
    { label: string; badgeClass: string; borderAccent: string }
  > = {
    kosong: {
      label: "Kosong",
      badgeClass: "badge-kosong",
      borderAccent: "border-status-kosong/30",
    },
    terisi: {
      label: "Terisi",
      badgeClass: "badge-terisi",
      borderAccent: "border-status-terisi/30",
    },
    maintenance: {
      label: "Perbaikan",
      badgeClass: "badge-maintenance",
      borderAccent: "border-status-maintenance/30",
    },
  };

  const currentStatus = statusConfig[room.status] || statusConfig.kosong;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(room)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(room);
        }
      }}
      aria-label={`Kamar ${room.room_number}, tipe ${room.room_type === "ac" ? "AC" : "Kipas"}, status ${currentStatus.label}, tarif ${formatRupiah(room.monthly_price)} per bulan`}
      className={`room-card group relative flex cursor-pointer flex-col justify-between rounded-2xl border bg-card p-4 shadow-xs transition-all hover:shadow-md hover:border-brand/50 ${currentStatus.borderAccent}`}
    >
      {/* Bagian Atas: Nomor Kamar, Tipe, dan Badge Status */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <span className="font-heading text-2xl font-bold tracking-tight text-foreground group-hover:text-brand transition-colors">
              {room.room_number}
            </span>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                  room.room_type === "ac"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {room.room_type === "ac" ? (
                  <>
                    <AcIcon size={12} />
                    <span>AC</span>
                  </>
                ) : (
                  <>
                    <FanIcon size={12} />
                    <span>Kipas</span>
                  </>
                )}
              </span>
            </div>
          </div>

          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${currentStatus.badgeClass}`}
          >
            {currentStatus.label}
          </span>
        </div>

        {/* Harga Sewa */}
        <div className="text-sm font-semibold text-foreground/80 mt-2">
          {formatRupiah(room.monthly_price)}
          <span className="text-xs font-normal text-muted-foreground"> /bln</span>
        </div>

        {/* Info Penyewa atau Status Keterangan */}
        <div className="mt-3 pt-3 border-t border-border/60 min-h-[38px] flex items-center">
          {tenant ? (
            <div className="flex items-center gap-2 text-xs text-foreground font-medium truncate">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-muted text-brand">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-3 w-3"
                >
                  <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
                </svg>
              </div>
              <span className="truncate">{tenant.full_name}</span>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              {room.status === "maintenance" ? (
                <>
                  <WrenchIcon size={12} className="text-status-maintenance" />
                  <span>Dalam perbaikan</span>
                </>
              ) : (
                <span>Siap huni</span>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Ubah Status 2-Tap (Khusus Admin) */}
      {isAdmin && (
        <div
          className="mt-3 pt-2.5 flex items-center justify-between border-t border-border/40 text-xs"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-[11px] text-muted-foreground font-medium">
            Status:
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label={`Ubah kamar ${room.room_number} ke status Kosong`}
              onClick={() => onQuickStatusChange(room, "kosong")}
              className={`rounded-lg px-2 py-1 text-[11px] font-medium transition-colors touch-manipulation ${
                room.status === "kosong"
                  ? "bg-status-kosong text-white font-semibold"
                  : "bg-muted text-muted-foreground hover:bg-status-kosong-bg hover:text-status-kosong"
              }`}
            >
              Kosong
            </button>
            <button
              type="button"
              aria-label={`Ubah kamar ${room.room_number} ke status Terisi`}
              onClick={() => onQuickStatusChange(room, "terisi")}
              className={`rounded-lg px-2 py-1 text-[11px] font-medium transition-colors touch-manipulation ${
                room.status === "terisi"
                  ? "bg-status-terisi text-white font-semibold"
                  : "bg-muted text-muted-foreground hover:bg-status-terisi-bg hover:text-status-terisi"
              }`}
            >
              Terisi
            </button>
            <button
              type="button"
              aria-label={`Ubah kamar ${room.room_number} ke status Perbaikan`}
              onClick={() => onQuickStatusChange(room, "maintenance")}
              className={`rounded-lg px-2 py-1 text-[11px] font-medium transition-colors touch-manipulation ${
                room.status === "maintenance"
                  ? "bg-status-maintenance text-white font-semibold"
                  : "bg-muted text-muted-foreground hover:bg-status-maintenance-bg hover:text-status-maintenance"
              }`}
            >
              Perbaikan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
