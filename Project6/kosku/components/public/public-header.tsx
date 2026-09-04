"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CreditCardIcon,
  HomeIcon,
  SparklesIcon,
  MapPinIcon,
  LockIcon,
} from "@/components/shared/icons";

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/90 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white shadow-xs group-hover:bg-brand-dark transition-colors">
            <HomeIcon size={18} />
          </div>
          <div>
            <span className="font-heading text-xl font-bold tracking-tight text-foreground">
              KosKu
            </span>
            <span className="block text-[10px] text-muted-foreground leading-none font-medium">
              Hunian Nyaman & Tenang
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav aria-label="Navigasi Publik" className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <Link
            href="/#katalog"
            className="hover:text-brand transition-colors"
          >
            Pilihan Kamar
          </Link>
          <Link
            href="/#fasilitas"
            className="hover:text-brand transition-colors"
          >
            Fasilitas
          </Link>
          <Link
            href="/#lokasi"
            className="hover:text-brand transition-colors"
          >
            Lokasi & Aturan
          </Link>
          <Link
            href="/cek-tagihan"
            className="flex items-center gap-1.5 text-foreground hover:text-brand transition-colors font-semibold"
          >
            <CreditCardIcon size={16} className="text-brand" />
            <span>Cek Tagihan Mandiri</span>
          </Link>
        </nav>

        {/* Action Button: Masuk Pengelola */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted hover:text-brand transition-all shadow-xs touch-manipulation"
          >
            <LockIcon size={13} className="text-muted-foreground" />
            <span>Portal Pengelola</span>
          </Link>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-border text-foreground hover:bg-muted transition-colors touch-manipulation"
            aria-label="Buka menu navigasi"
            aria-expanded={mobileMenuOpen}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              className="h-5 w-5"
            >
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-card px-4 py-4 space-y-3 shadow-lg animate-in slide-in-from-top-2">
          <Link
            href="/#katalog"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <HomeIcon size={16} className="text-brand" />
            <span>Pilihan Kamar</span>
          </Link>
          <Link
            href="/#fasilitas"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <SparklesIcon size={16} className="text-brand" />
            <span>Fasilitas Kos</span>
          </Link>
          <Link
            href="/#lokasi"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <MapPinIcon size={16} className="text-brand" />
            <span>Lokasi & Aturan</span>
          </Link>
          <Link
            href="/cek-tagihan"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-brand bg-brand-muted/40 transition-colors"
          >
            <CreditCardIcon size={16} />
            <span>Portal Cek Tagihan Penghuni</span>
          </Link>
          <div className="pt-2 border-t border-border">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
            >
              <LockIcon size={14} className="text-muted-foreground" />
              <span>Masuk Portal Pengelola</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
