"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Room, RoomInsert, RoomStatus, RoomType, Tenant, Expense } from "@/types/database";
import { KamarCard } from "@/components/kamar/kamar-card";
import { KamarDetailModal } from "@/components/kamar/kamar-detail-modal";
import { KamarFormModal } from "@/components/kamar/kamar-form-modal";
import { downloadCsv } from "@/lib/export-utils";
import { useUser } from "@/lib/context/user-context";
import { AcIcon, FanIcon, SearchIcon } from "@/components/shared/icons";

export default function KamarPage() {
  const { isAdmin } = useUser();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"semua" | RoomStatus>("semua");
  const [typeFilter, setTypeFilter] = useState<"semua" | RoomType>("semua");

  // Modal states
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [roomToEdit, setRoomToEdit] = useState<Room | null>(null);

  const supabase = createClient();

  // Helper trigger floating toast
  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 3500);
  }

  // Fetch Rooms & Active Tenants
  async function loadData() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [
        { data: roomsData, error: roomsError },
        { data: tenantsData, error: tenantsError },
        { data: expensesData },
      ] = await Promise.all([
        supabase.from("rooms").select("*").order("room_number", { ascending: true }),
        supabase.from("tenants").select("*").order("move_in_date", { ascending: false }),
        supabase.from("expenses").select("*").not("room_id", "is", null),
      ]);

      if (roomsError) throw roomsError;
      if (tenantsError) throw tenantsError;

      // Urutkan kamar secara natural (misal: 101, 102 ... 201)
      const sortedRooms = (roomsData || []).sort((a, b) =>
        a.room_number.localeCompare(b.room_number, undefined, { numeric: true })
      );

      setRooms(sortedRooms);
      setTenants(tenantsData || []);
      setExpenses((expensesData as Expense[]) || []);
    } catch (err: any) {
      console.error("Error loading rooms:", err);
      setErrorMsg(err.message || "Gagal memuat data kamar dari Supabase.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Map active tenant by room_id untuk O(1) lookup
  const tenantByRoomId = useMemo(() => {
    const map = new Map<string, Tenant>();
    tenants.forEach((t) => {
      if (t.room_id && t.is_active) {
        map.set(t.room_id, t);
      }
    });
    return map;
  }, [tenants]);

  // Statistik Ringkasan Kamar
  const stats = useMemo(() => {
    const total = rooms.length;
    const kosong = rooms.filter((r) => r.status === "kosong").length;
    const terisi = rooms.filter((r) => r.status === "terisi").length;
    const maintenance = rooms.filter((r) => r.status === "maintenance").length;
    return { total, kosong, terisi, maintenance };
  }, [rooms]);

  // Filter Kamar
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      // Filter Status
      if (statusFilter !== "semua" && room.status !== statusFilter) {
        return false;
      }
      // Filter Tipe
      if (typeFilter !== "semua" && room.room_type !== typeFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchNumber = room.room_number.toLowerCase().includes(query);
        const tenant = tenantByRoomId.get(room.id);
        const matchTenant = tenant
          ? tenant.full_name.toLowerCase().includes(query)
          : false;
        return matchNumber || matchTenant;
      }
      return true;
    });
  }, [rooms, statusFilter, typeFilter, searchQuery, tenantByRoomId]);

  // Quick Status Change (2-Tap)
  async function handleQuickStatusChange(room: Room, newStatus: RoomStatus) {
    if (room.status === newStatus) return;

    // Optimistic UI update
    setRooms((prev) =>
      prev.map((r) => (r.id === room.id ? { ...r, status: newStatus } : r))
    );
    if (selectedRoom?.id === room.id) {
      setSelectedRoom((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    try {
      const { error } = await supabase
        .from("rooms")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", room.id);

      if (error) throw error;
      showToast(`Status Kamar ${room.room_number} diubah ke "${newStatus}".`);
    } catch (err: any) {
      console.error("Gagal update status kamar:", err);
      showToast("Gagal memperbarui status. Memulihkan data...");
      loadData();
    }
  }

  // Simpan Kamar (Tambah Baru atau Edit)
  async function handleSaveRoom(
    payload: RoomInsert,
    roomId?: string
  ): Promise<boolean> {
    try {
      if (roomId) {
        // Mode Edit
        const { data, error } = await supabase
          .from("rooms")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", roomId)
          .select()
          .single();

        if (error) throw error;

        setRooms((prev) =>
          prev.map((r) => (r.id === roomId ? { ...r, ...data } : r))
        );
        if (selectedRoom?.id === roomId) {
          setSelectedRoom(data);
        }
        showToast(`Kamar ${payload.room_number} berhasil diperbarui.`);
      } else {
        // Mode Tambah Baru
        const { data, error } = await supabase
          .from("rooms")
          .insert([payload])
          .select()
          .single();

        if (error) throw error;

        setRooms((prev) =>
          [...prev, data].sort((a, b) =>
            a.room_number.localeCompare(b.room_number, undefined, {
              numeric: true,
            })
          )
        );
        showToast(`Kamar ${payload.room_number} berhasil ditambahkan.`);
      }
      return true;
    } catch (err: any) {
      console.error("Gagal menyimpan kamar:", err);
      return false;
    }
  }

  // Hapus Kamar
  async function handleDeleteRoom(room: Room) {
    const tenant = tenantByRoomId.get(room.id);
    if (tenant) {
      alert(
        `Kamar ${room.room_number} tidak bisa dihapus karena sedang dihuni oleh ${tenant.full_name}. Harap checkout atau pindahkan penyewa terlebih dahulu.`
      );
      return;
    }

    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus Kamar ${room.room_number}? Tindakan ini tidak dapat dibatalkan.`
    );
    if (!confirmDelete) return;

    try {
      const { error } = await supabase.from("rooms").delete().eq("id", room.id);
      if (error) throw error;

      setRooms((prev) => prev.filter((r) => r.id !== room.id));
      setIsDetailOpen(false);
      setSelectedRoom(null);
      showToast(`Kamar ${room.room_number} berhasil dihapus.`);
    } catch (err: any) {
      console.error("Gagal menghapus kamar:", err);
      alert(`Gagal menghapus kamar: ${err.message}`);
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast Notifikasi */}
      {toastMsg && (
        <div className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 rounded-xl bg-foreground text-card px-4 py-3 text-sm font-medium shadow-xl border border-border animate-in fade-in slide-in-from-bottom-2">
          {toastMsg}
        </div>
      )}

      {/* Header Halaman & Tombol Tambah */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Manajemen Kamar
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola ketersediaan, tipe, dan tarif 20 kamar kos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const rows: (string | number)[][] = [
                ["REKAP DAFTAR KAMAR KOSKU"],
                ["Tanggal Unduh", new Date().toLocaleDateString("id-ID")],
                [],
                ["No", "Nomor Kamar", "Tipe", "Tarif Bulanan (Rp)", "Status", "Penghuni Aktif", "Catatan Fasilitas"],
              ];
              rooms.forEach((r, idx) => {
                const activeT = tenantByRoomId.get(r.id);
                rows.push([
                  idx + 1,
                  r.room_number,
                  r.room_type.toUpperCase(),
                  r.monthly_price,
                  r.status.toUpperCase(),
                  activeT?.full_name || "-",
                  r.notes || "-",
                ]);
              });
              const todayStr = new Date().toISOString().split("T")[0];
              downloadCsv(`Rekap_Kamar_KosKu_${todayStr}.csv`, rows);
              showToast("File Rekap Kamar berhasil diunduh!");
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-xs"
            title="Unduh data kamar format CSV/Excel"
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
                setRoomToEdit(null);
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
              <span>+ Tambah Kamar</span>
            </button>
          )}
        </div>
      </div>

      {/* Bar Statistik Ringkasan */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-xs">
          <span className="text-xs font-medium text-muted-foreground">
            Total Kamar
          </span>
          <p className="mt-1 font-heading text-2xl font-bold text-foreground">
            {stats.total}
          </p>
        </div>

        <div
          onClick={() => setStatusFilter("kosong")}
          className={`cursor-pointer rounded-xl border p-3.5 shadow-xs transition-all ${
            statusFilter === "kosong"
              ? "border-status-kosong bg-status-kosong-bg ring-2 ring-status-kosong/20"
              : "border-border bg-card hover:border-status-kosong/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-status-kosong">
              Kosong (Siap)
            </span>
            <span className="h-2 w-2 rounded-full bg-status-kosong" />
          </div>
          <p className="mt-1 font-heading text-2xl font-bold text-status-kosong">
            {stats.kosong}
          </p>
        </div>

        <div
          onClick={() => setStatusFilter("terisi")}
          className={`cursor-pointer rounded-xl border p-3.5 shadow-xs transition-all ${
            statusFilter === "terisi"
              ? "border-status-terisi bg-status-terisi-bg ring-2 ring-status-terisi/20"
              : "border-border bg-card hover:border-status-terisi/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-status-terisi">Terisi</span>
            <span className="h-2 w-2 rounded-full bg-status-terisi" />
          </div>
          <p className="mt-1 font-heading text-2xl font-bold text-status-terisi">
            {stats.terisi}
          </p>
        </div>

        <div
          onClick={() => setStatusFilter("maintenance")}
          className={`cursor-pointer rounded-xl border p-3.5 shadow-xs transition-all ${
            statusFilter === "maintenance"
              ? "border-status-maintenance bg-status-maintenance-bg ring-2 ring-status-maintenance/20"
              : "border-border bg-card hover:border-status-maintenance/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-status-maintenance">
              Perbaikan
            </span>
            <span className="h-2 w-2 rounded-full bg-status-maintenance" />
          </div>
          <p className="mt-1 font-heading text-2xl font-bold text-status-maintenance">
            {stats.maintenance}
          </p>
        </div>
      </div>

      {/* Kontrol Filter & Pencarian */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
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
              placeholder="Cari nomor kamar atau nama penyewa..."
              className="w-full rounded-xl border border-border bg-background pl-9 pr-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-muted-foreground hover:text-foreground"
              >
                Bersihkan
              </button>
            )}
          </div>

          {/* Filter Status Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            {(
              [
                { id: "semua", label: "Semua Status" },
                { id: "kosong", label: "Kosong" },
                { id: "terisi", label: "Terisi" },
                { id: "maintenance", label: "Perbaikan" },
              ] as const
            ).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStatusFilter(s.id)}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  statusFilter === s.id
                    ? "bg-foreground text-card shadow-xs"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Filter Tipe Buttons */}
          <div className="flex items-center gap-1 border-t md:border-t-0 md:border-l border-border pt-2 md:pt-0 md:pl-3">
            {(
              [
                { id: "semua", label: "Semua Tipe", icon: null },
                { id: "ac", label: "AC", icon: AcIcon },
                { id: "kipas", label: "Kipas", icon: FanIcon },
              ] as const
            ).map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTypeFilter(t.id)}
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                    typeFilter === t.id
                      ? "bg-brand text-white shadow-xs"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  }`}
                >
                  {Icon && <Icon size={13} />}
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid Kamar */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-44 rounded-xl border border-border bg-card/60 animate-pulse p-4"
            >
              <div className="h-6 w-12 bg-muted rounded mb-2" />
              <div className="h-4 w-20 bg-muted rounded mb-4" />
              <div className="h-4 w-24 bg-muted rounded mt-8" />
            </div>
          ))}
        </div>
      ) : errorMsg ? (
        <div className="rounded-xl border border-destructive/20 bg-status-terisi-bg p-6 text-center">
          <p className="text-sm font-semibold text-destructive">{errorMsg}</p>
          <button
            type="button"
            onClick={loadData}
            className="btn-brand mt-3 px-4 py-2 text-xs"
          >
            Coba Lagi
          </button>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border bg-card/40 p-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <SearchIcon size={22} />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            Tidak ada kamar yang sesuai filter
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Coba ubah kata kunci pencarian atau reset filter status dan tipe.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("semua");
              setTypeFilter("semua");
            }}
            className="mt-4 inline-flex items-center rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
          >
            Reset Semua Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredRooms.map((room) => (
            <KamarCard
              key={room.id}
              room={room}
              tenant={tenantByRoomId.get(room.id)}
              isAdmin={isAdmin}
              onSelect={(r) => {
                setSelectedRoom(r);
                setIsDetailOpen(true);
              }}
              onQuickStatusChange={handleQuickStatusChange}
            />
          ))}
        </div>
      )}

      {/* Modal Detail Kamar */}
      <KamarDetailModal
        room={selectedRoom}
        tenant={selectedRoom ? tenantByRoomId.get(selectedRoom.id) : null}
        allRoomTenants={
          selectedRoom
            ? tenants.filter((t) => t.room_id === selectedRoom.id)
            : []
        }
        roomExpenses={
          selectedRoom
            ? expenses.filter((e) => e.room_id === selectedRoom.id)
            : []
        }
        isAdmin={isAdmin}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedRoom(null);
        }}
        onEdit={(r) => {
          setRoomToEdit(r);
          setIsFormOpen(true);
        }}
        onDelete={handleDeleteRoom}
        onStatusChange={handleQuickStatusChange}
      />

      {/* Modal Form Tambah / Edit Kamar */}
      <KamarFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setRoomToEdit(null);
        }}
        roomToEdit={roomToEdit}
        onSave={handleSaveRoom}
      />
    </div>
  );
}
