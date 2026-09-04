"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const supabase = createClient();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(
          error.message === "Invalid login credentials"
            ? "Email atau password salah"
            : error.message || "Gagal masuk, coba lagi"
        );
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } else {
      // Register mode
      if (!fullName.trim()) {
        setError("Nama lengkap wajib diisi");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        setError(error.message || "Gagal mendaftar, coba lagi");
        setLoading(false);
        return;
      }

      if (data.session) {
        // Langsung terautentikasi (tanpa confirm email)
        router.push("/dashboard");
        router.refresh();
      } else {
        // Perlu konfirmasi email atau dibuat
        setSuccessMsg(
          "Akun berhasil didaftarkan! Jika konfirmasi email aktif di Supabase, silakan periksa kotak masuk email Anda sebelum masuk."
        );
        setMode("login");
      }
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Logo & Judul */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand text-white shadow-md shadow-brand/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-8 w-8"
            >
              <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
              <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">KosKu</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sistem Manajemen Kos Keluarga
          </p>
        </div>

        {/* Tab Toggle: Masuk vs Daftar */}
        <div role="tablist" aria-label="Mode Masuk" className="mb-6 grid grid-cols-2 rounded-xl bg-card border border-border p-1">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`rounded-lg py-2.5 min-h-[42px] text-sm font-medium transition-all touch-manipulation ${
              mode === "login"
                ? "bg-brand text-white shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Masuk
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "register"}
            onClick={() => {
              setMode("register");
              setError(null);
            }}
            className={`rounded-lg py-2.5 min-h-[42px] text-sm font-medium transition-all touch-manipulation ${
              mode === "register"
                ? "bg-brand text-white shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Daftar Baru
          </button>
        </div>

        {/* Form Login / Register */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label
                htmlFor="fullName"
                className="mb-1.5 block text-sm font-medium"
              >
                Nama Lengkap
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Contoh: Pak Budi"
                required
                className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-base placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-base placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              required
              minLength={6}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-base placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-status-terisi-bg border border-status-terisi/20 px-3.5 py-2.5 text-sm text-status-terisi">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="rounded-lg bg-status-kosong-bg border border-status-kosong/20 px-3.5 py-2.5 text-sm text-status-kosong">
              {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-brand w-full px-4 py-2.5 text-base shadow-sm disabled:opacity-50"
          >
            {loading
              ? "Memproses..."
              : mode === "login"
              ? "Masuk"
              : "Daftar Akun"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {mode === "register"
            ? "Akun pertama yang mendaftar otomatis menjadi Admin"
            : "Hanya untuk keluarga pengelola kos"}
        </p>
      </div>
    </div>
  );
}

