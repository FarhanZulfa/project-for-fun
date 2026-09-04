"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Room, Tenant, TenantInsert } from "@/types/database";
import { formatTanggal, labelRelatif } from "@/lib/utils";
import { PenyewaFormModal } from "@/components/penyewa/penyewa-form-modal";
import { PenyewaCheckoutModal } from "@/components/penyewa/penyewa-checkout-modal";
import { exportPenyewaCsv } from "@/lib/export-utils";
import { useUser } from "@/lib/context/user-context";
import Link from "next/link";
import { UsersIcon, DoorIcon, WhatsAppIcon, CoinsIcon } from "@/components/shared/icons";

function PenyewaContent() {
  const { isAdmin } = useUser();
  const searchParams = useSearchParams();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"aktif" | "riwayat">("aktif");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [tenantToEdit, setTenantToEdit] = useState<Tenant | null>(null);
  const [preselectedRoomId, setPreselectedRoomId] = useState<string | null>(null);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [tenantToCheckout, setTenantToCheckout] = useState<Tenant | null>(null);

  const supabase = createClient();

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
      // 1. Ambil semua penyewa
      const { data: tenantsData, error: tenantsError } = await supabase
        .from("tenants")
        .select("*")
        .order("created_at", { ascending: false });

      if (tenantsError) throw tenantsError;

      // 2. Ambil semua kamar untuk mapping
      const { data: roomsData, error: roomsError } = await supabase
        .from("rooms")
        .select("*")
        .order("room_number", { ascending: true });

      if (roomsError) throw roomsError;

      setTenants(tenantsData || []);
      setRooms(roomsData || []);
    } catch (err: any) {
      console.error("Error loading tenants:", err);
      showToast("Gagal memuat data penyewa.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Cek query param jika diarahkan dari Kamar detail
  useEffect(() => {
    const tambah = searchParams.get("tambah");
    const roomId = searchParams.get("room_id");
    if (tambah === "true" && roomId) {
      setPreselectedRoomId(roomId);
      setTenantToEdit(null);
      setIsFormOpen(true);
    }
  }, [searchParams]);

  // Lookup Room by Id
  const roomById = useMemo(() => {
    const map = new Map<string, Room>();
    rooms.forEach((r) => map.set(r.id, r));
    return map;
  }, [rooms]);

  // Pisahkan penyewa aktif dan riwayat
  const activeTenants = useMemo(
    () => tenants.filter((t) => t.is_active),
    [tenants]
  );
  const inactiveTenants = useMemo(
    () => tenants.filter((t) => !t.is_active),
    [tenants]
  );

  // Filter list berdasarkan tab dan pencarian
  const currentList = activeTab === "aktif" ? activeTenants : inactiveTenants;
  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return currentList;
    const q = searchQuery.toLowerCase().trim();
    return currentList.filter((t) => {
      const room = t.room_id ? roomById.get(t.room_id) : null;
      const matchName = t.full_name.toLowerCase().includes(q);
      const matchPhone = t.phone_number?.toLowerCase().includes(q) || false;
      const matchRoom = room
        ? room.room_number.toLowerCase().includes(q)
        : false;
      return matchName || matchPhone || matchRoom;
    });
  }, [currentList, searchQuery, roomById]);

  // Simpan Penyewa (Tambah / Edit)
  async function handleSaveTenant(
    payload: TenantInsert,
    tenantId?: string,
    previousRoomId?: string | null
  ): Promise<boolean> {
    try {
      if (tenantId) {
        // Mode Edit
        const { data, error } = await supabase
          .from("tenants")
          .update({
            ...payload,
            updated_at: new Date().toISOString(),
          })
          .eq("id", tenantId)
          .select()
          .single();

        if (error) throw error;

        // Jika kamar berubah
        if (previousRoomId && previousRoomId !== payload.room_id) {
          // Kosongkan kamar lama
          await supabase
            .from("rooms")
            .update({ status: "kosong" })
            .eq("id", previousRoomId);

          // Isi kamar baru
          await supabase
            .from("rooms")
            .update({ status: "terisi" })
            .eq("id", payload.room_id);
        } else {
          // Pastikan kamar terisi
          await supabase
            .from("rooms")
            .update({ status: "terisi" })
            .eq("id", payload.room_id);
        }

        showToast(`Data penyewa ${payload.full_name} berhasil diperbarui.`);
      } else {
        // Mode Tambah Baru
        const { data, error } = await supabase
          .from("tenants")
          .insert([payload])
          .select()
          .single();

        if (error) throw error;

        // Otomatis update status kamar menjadi 'terisi'
        await supabase
          .from("rooms")
          .update({ status: "terisi" })
          .eq("id", payload.room_id);

        showToast(
          `Penyewa ${payload.full_name} berhasil didaftarkan ke kamar.`
        );
      }

      loadData();
      return true;
    } catch (err: any) {
      console.error("Gagal simpan penyewa:", err);
      return false;
    }
  }

  // Proses Checkout Penyewa
  async function handleConfirmCheckout(
    tenantId: string,
    roomId: string | null,
    moveOutDate: string
  ): Promise<boolean> {
    try {
      // 1. Update status tenant is_active = false
      const { error: tenantError } = await supabase
        .from("tenants")
        .update({
          is_active: false,
          move_out_date: moveOutDate,
          updated_at: new Date().toISOString(),
        })
        .eq("id", tenantId);

      if (tenantError) throw tenantError;

      // 2. Kosongkan kamar terkait
      if (roomId) {
        const { error: roomError } = await supabase
          .from("rooms")
          .update({ status: "kosong" })
          .eq("id", roomId);

        if (roomError) throw roomError;
      }

      showToast("Penyewa berhasil checkout dan kamar telah dikosongkan.");
      loadData();
      return true;
    } catch (err: any) {
      console.error("Gagal checkout penyewa:", err);
      return false;
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 rounded-xl bg-foreground text-card px-4 py-3 text-sm font-medium shadow-xl border border-border animate-in fade-in slide-in-from-bottom-2">
          {toastMsg}
        </div>
      )}

      {/* Header & Tombol Tambah */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Manajemen Penyewa
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola data penghuni aktif, kontak WhatsApp, dan riwayat checkout
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              exportPenyewaCsv(tenants, roomById);
              showToast("File Rekap Penyewa berhasil diunduh!");
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-xs touch-manipulation"
            title="Unduh daftar penyewa dalam format CSV/Excel"
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
                setTenantToEdit(null);
                setPreselectedRoomId(null);
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
              <span>+ Tambah Penyewa</span>
            </button>
          )}
        </div>
      </div>

      {/* Bar Statistik Ringkasan */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <span className="text-xs font-medium text-muted-foreground">
            Penyewa Aktif
          </span>
          <p className="mt-1 font-heading text-2xl font-bold text-foreground">
            {activeTenants.length}{" "}
            <span className="text-xs font-normal text-muted-foreground">orang</span>
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <span className="text-xs font-medium text-muted-foreground">
            Kamar Terhuni
          </span>
          <p className="mt-1 font-heading text-2xl font-bold text-status-terisi">
            {activeTenants.length} / {rooms.length}{" "}
            <span className="text-xs font-normal text-muted-foreground">kamar</span>
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-xs font-medium text-muted-foreground">
            Riwayat Alumni Keluar
          </span>
          <p className="mt-1 font-heading text-2xl font-bold text-muted-foreground">
            {inactiveTenants.length}{" "}
            <span className="text-xs font-normal text-muted-foreground">orang</span>
          </p>
        </div>
      </div>

      {/* Tab Navigasi & Pencarian */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Tab Button */}
          <div className="flex w-full sm:w-auto rounded-lg bg-muted p-1">
            <button
              type="button"
              onClick={() => setActiveTab("aktif")}
              className={`flex-1 sm:flex-none rounded-md px-4 py-1.5 text-xs font-semibold transition-all ${
                activeTab === "aktif"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Penyewa Aktif ({activeTenants.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("riwayat")}
              className={`flex-1 sm:flex-none rounded-md px-4 py-1.5 text-xs font-semibold transition-all ${
                activeTab === "riwayat"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Riwayat Keluar ({inactiveTenants.length})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
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
              placeholder="Cari nama, HP, atau kamar..."
              className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-1.5 text-xs focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
        </div>
      </div>

      {/* List Penyewa */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-xl border border-border bg-card/60 animate-pulse p-4"
            />
          ))}
        </div>
      ) : filteredList.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 p-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <UsersIcon size={22} />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            {searchQuery
              ? "Tidak ada penyewa yang cocok dengan pencarian"
              : activeTab === "aktif"
              ? "Belum ada penyewa aktif"
              : "Belum ada riwayat penyewa keluar"}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            {activeTab === "aktif" && !searchQuery
              ? "Klik tombol 'Tambah Penyewa' di atas untuk mendaftarkan penghuni pertama ke kamar kos Anda."
              : "Coba ubah kata kunci pencarian Anda."}
          </p>
          {activeTab === "aktif" && !searchQuery && (
            <button
              type="button"
              onClick={() => {
                setTenantToEdit(null);
                setPreselectedRoomId(null);
                setIsFormOpen(true);
              }}
              className="btn-brand mt-4 px-4 py-2 text-xs"
            >
              + Tambah Penyewa Sekarang
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredList.map((tenant) => {
            const room = tenant.room_id ? roomById.get(tenant.room_id) : null;
            const waUrl = tenant.phone_number
              ? `https://wa.me/${tenant.phone_number.replace(
                  /\D/g,
                  ""
                )}?text=Halo%20${encodeURIComponent(
                  tenant.full_name
                )},%20dari%20pengelola%20KosKu...`
              : null;

            return (
              <div
                key={tenant.id}
                className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-xs hover:border-brand/30 transition-all space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-heading text-lg font-bold text-foreground">
                        {tenant.full_name}
                      </h3>
                      {room ? (
                        <div className="mt-1 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-md bg-brand-muted px-2 py-0.5 text-xs font-semibold text-brand">
                            <DoorIcon size={12} />
                            <span>Kamar {room.room_number}</span>
                          </span>
                          <span
                            className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium ${
                              room.room_type === "ac"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {room.room_type.toUpperCase()}
                          </span>
                        </div>
                      ) : (
                        <span className="mt-1 inline-block text-xs text-muted-foreground italic">
                          Tanpa kamar terkait
                        </span>
                      )}
                    </div>

                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        tenant.is_active
                          ? "badge-terisi"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {tenant.is_active ? "Aktif" : "Sudah Keluar"}
                    </span>
                  </div>

                  {/* Kontak & Tanggal */}
                  <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                    {tenant.phone_number && (
                      <div className="flex items-center justify-between">
                        <span>No. HP / WA:</span>
                        <span className="font-medium text-foreground">
                          {tenant.phone_number}
                        </span>
                      </div>
                    )}
                    {tenant.id_number && (
                      <div className="flex items-center justify-between">
                        <span>No. KTP:</span>
                        <span className="font-medium text-foreground">
                          {tenant.id_number}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span>Mulai Masuk:</span>
                      <span className="font-medium text-foreground">
                        {formatTanggal(tenant.move_in_date)}
                      </span>
                    </div>
                    {tenant.is_active && tenant.move_in_date && (
                      <div className="flex items-center justify-between">
                        <span>Durasi Tinggal:</span>
                        <span className="font-medium text-brand">
                          {labelRelatif(tenant.move_in_date)}
                        </span>
                      </div>
                    )}
                    {!tenant.is_active && tenant.move_out_date && (
                      <div className="flex items-center justify-between">
                        <span>Tanggal Keluar:</span>
                        <span className="font-medium text-destructive">
                          {formatTanggal(tenant.move_out_date)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tombol Aksi */}
                <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition-colors shadow-xs"
                      >
                        <WhatsAppIcon size={13} />
                        <span>WA</span>
                      </a>
                    )}
                    {tenant.is_active && (
                      <Link
                        href={`/pembayaran?tenant_id=${tenant.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                      >
                        <CoinsIcon size={13} className="text-brand" />
                        <span>Bayar</span>
                      </Link>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isAdmin && (
                      tenant.is_active ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setTenantToEdit(tenant);
                              setIsFormOpen(true);
                            }}
                            className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTenantToCheckout(tenant);
                              setIsCheckoutOpen(true);
                            }}
                            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-status-terisi-bg transition-colors"
                          >
                            Checkout
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setTenantToEdit(tenant);
                            setIsFormOpen(true);
                          }}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand-muted transition-colors"
                        >
                          Daftar Ulang (Check-in)
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Form Tambah / Edit */}
      <PenyewaFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setTenantToEdit(null);
          setPreselectedRoomId(null);
        }}
        tenantToEdit={tenantToEdit}
        rooms={rooms}
        preselectedRoomId={preselectedRoomId}
        onSave={handleSaveTenant}
      />

      {/* Modal Checkout */}
      <PenyewaCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => {
          setIsCheckoutOpen(false);
          setTenantToCheckout(null);
        }}
        tenant={tenantToCheckout}
        room={tenantToCheckout?.room_id ? roomById.get(tenantToCheckout.room_id) : null}
        onConfirmCheckout={handleConfirmCheckout}
      />
    </div>
  );
}

export default function PenyewaPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-28 rounded-xl bg-card border border-border animate-pulse" />
        </div>
      }
    >
      <PenyewaContent />
    </Suspense>
  );
}
