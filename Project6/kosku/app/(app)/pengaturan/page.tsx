"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Profile, UserRole } from "@/types/database";
import { useUser } from "@/lib/context/user-context";
import { formatTanggal } from "@/lib/utils";
import { ShieldIcon, UsersIcon, SparklesIcon } from "@/components/shared/icons";

export default function PengaturanKeluargaPage() {
  const { user, profile, isAdmin, refreshProfile } = useUser();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const supabase = createClient();

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 3500);
  }

  async function loadProfiles() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setProfiles(data || []);
    } catch (err: any) {
      console.error("Gagal memuat profil keluarga:", err);
      showToast("Gagal memuat profil keluarga.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfiles();
  }, []);

  async function handleRoleChange(targetProfile: Profile, newRole: UserRole) {
    if (!isAdmin) {
      alert("Hanya Admin yang dapat mengubah hak akses anggota keluarga.");
      return;
    }

    // Cegah admin tunggal mencabut akses admin dirinya sendiri
    if (targetProfile.id === user?.id && newRole === "viewer") {
      const otherAdmins = profiles.filter(
        (p) => p.role === "admin" && p.id !== user?.id
      );
      if (otherAdmins.length === 0) {
        alert(
          "Anda adalah satu-satunya Admin. Jadikan anggota keluarga lain sebagai Admin terlebih dahulu sebelum mengubah akun Anda menjadi Viewer."
        );
        return;
      }
    }

    setUpdatingId(targetProfile.id);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", targetProfile.id);

      if (error) throw error;

      showToast(
        `Peran ${targetProfile.full_name} berhasil diubah menjadi "${
          newRole === "admin" ? "Admin" : "Viewer"
        }".`
      );
      await loadProfiles();
      await refreshProfile();
    } catch (err: any) {
      console.error("Gagal mengubah role:", err);
      alert(`Gagal mengubah role: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Toast Notifikasi */}
      {toastMsg && (
        <div className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 rounded-xl bg-foreground text-card px-4 py-3 text-sm font-medium shadow-xl border border-border animate-in fade-in slide-in-from-bottom-2">
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Pengaturan Keluarga & Hak Akses
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola siapa saja anggota keluarga yang dapat mengelola atau melihat data kos
        </p>
      </div>

      {/* Kartu Profil Saya */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
        <h2 className="font-heading text-lg font-bold text-foreground mb-4">
          Akun Anda Saat Ini
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <span className="text-xs text-muted-foreground">Nama Pengguna</span>
            <p className="text-sm font-semibold text-foreground mt-0.5">
              {profile?.full_name || user?.user_metadata?.full_name || "Pengguna"}
            </p>
          </div>

          <div>
            <span className="text-xs text-muted-foreground">Email Terdaftar</span>
            <p className="text-sm font-semibold text-foreground mt-0.5 truncate">
              {user?.email}
            </p>
          </div>

          <div>
            <span className="text-xs text-muted-foreground">Peran / Hak Akses</span>
            <div className="mt-1">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                  isAdmin
                    ? "bg-status-kosong-bg text-status-kosong border border-status-kosong/20"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldIcon size={13} />
                    <span>Admin (Akses Penuh)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <UsersIcon size={13} />
                    <span>Viewer (Hanya Lihat)</span>
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border/60 text-xs text-muted-foreground">
          {isAdmin ? (
            <p>
              Sebagai <strong>Admin</strong>, Anda memiliki hak penuh untuk menambah, mengedit, menghapus kamar, penyewa, pembayaran, serta mengubah peran anggota keluarga lain.
            </p>
          ) : (
            <p>
              Sebagai <strong>Viewer</strong>, Anda memiliki hak baca untuk memantau okupansi kamar, daftar penyewa, dan riwayat pembayaran tanpa dapat mengubah data.
            </p>
          )}
        </div>
      </div>

      {/* Daftar Anggota Keluarga */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground">
              Daftar Anggota Keluarga ({profiles.length})
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Semua akun keluarga yang terhubung ke KosKu
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            Belum ada profil anggota keluarga lain.
          </p>
        ) : (
          <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
            {profiles.map((p) => {
              const isMe = p.id === user?.id;
              const isUpdating = updatingId === p.id;

              return (
                <div
                  key={p.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 bg-card hover:bg-muted/20 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">
                        {p.full_name}
                      </span>
                      {isMe && (
                        <span className="rounded bg-brand-muted px-1.5 py-0.2 text-[10px] font-semibold text-brand">
                          Anda
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground block mt-0.5">
                      Bergabung: {formatTanggal(p.created_at)}
                    </span>
                  </div>

                  {/* Pengaturan Peran */}
                  <div className="flex items-center gap-2">
                    {isAdmin ? (
                      <select
                        disabled={isUpdating}
                        value={p.role}
                        onChange={(e) =>
                          handleRoleChange(p, e.target.value as UserRole)
                        }
                        className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground focus:border-brand focus:outline-none"
                      >
                        <option value="admin">Admin (Kelola Penuh)</option>
                        <option value="viewer">Viewer (Hanya Baca)</option>
                      </select>
                    ) : (
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                          p.role === "admin"
                            ? "bg-status-kosong-bg text-status-kosong"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {p.role}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Petunjuk Menambahkan Anggota Keluarga */}
      <div className="rounded-2xl border border-brand/20 bg-brand-muted/30 p-6 space-y-3">
        <div className="flex items-center gap-2">
          <SparklesIcon size={16} className="text-brand shrink-0" />
          <h3 className="font-heading text-base font-bold text-brand">
            Cara Menambahkan Anggota Keluarga Baru
          </h3>
        </div>
        <ol className="list-decimal list-inside space-y-2 text-xs text-foreground/90 leading-relaxed">
          <li>
            Minta anggota keluarga membuka aplikasi KosKu di browser mereka (contoh: <code>http://localhost:3000</code>).
          </li>
          <li>
            Pilih tab <strong>&quot;Daftar Baru&quot;</strong> di halaman depan, lalu masukkan nama, email, dan password mereka.
          </li>
          <li>
            Setelah mereka mendaftar, akun mereka otomatis aktif dengan peran <strong>Viewer</strong>.
          </li>
          <li>
            Jika Anda ingin memberikan akses kelola penuh kepada mereka, buka halaman ini kembali dan ubah perannya menjadi <strong>Admin</strong>.
          </li>
        </ol>
      </div>
    </div>
  );
}
