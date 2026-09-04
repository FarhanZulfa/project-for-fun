import Link from "next/link";
import {
  HomeIcon,
  MapPinIcon,
  ClockIcon,
  LockIcon,
  WhatsAppIcon,
} from "@/components/shared/icons";

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-card text-foreground">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Kolom 1: Brand & Profil Singkat */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-white text-sm font-bold">
                <HomeIcon size={16} />
              </div>
              <span className="font-heading text-xl font-bold tracking-tight text-foreground">
                KosKu
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
              KosKu adalah hunian sewa kos yang mengedepankan kebersihan, ketenangan, keamanan, dan kenyamanan seperti di rumah sendiri bagi mahasiswa maupun pekerja profesional.
            </p>
            <div className="pt-2 text-xs text-muted-foreground space-y-1.5">
              <p className="flex items-center gap-2">
                <MapPinIcon size={14} className="text-brand shrink-0" />
                <span><strong>Alamat:</strong> Jl. Mawar Indah No. 20, Lingkungan Asri, Kota Anda</span>
              </p>
              <p className="flex items-center gap-2">
                <ClockIcon size={14} className="text-brand shrink-0" />
                <span><strong>Jam Survey:</strong> Setiap hari 08.00 - 20.00 WIB (Harap janjian via WA)</span>
              </p>
            </div>
          </div>

          {/* Kolom 2: Navigasi Cepat */}
          <div className="space-y-3">
            <h4 className="font-heading text-sm font-bold text-foreground uppercase tracking-wider">
              Navigasi
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground font-medium">
              <li>
                <Link href="/#katalog" className="hover:text-brand transition-colors">
                  Katalog Kamar Kos
                </Link>
              </li>
              <li>
                <Link href="/#fasilitas" className="hover:text-brand transition-colors">
                  Fasilitas Bersama
                </Link>
              </li>
              <li>
                <Link href="/#lokasi" className="hover:text-brand transition-colors">
                  Lokasi & Tata Tertib
                </Link>
              </li>
              <li>
                <Link href="/cek-tagihan" className="text-brand font-semibold hover:underline">
                  Portal Cek Tagihan Mandiri
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolom 3: Layanan & Akses */}
          <div className="space-y-3">
            <h4 className="font-heading text-sm font-bold text-foreground uppercase tracking-wider">
              Akses Pengelola
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground font-medium">
              <li>
                <Link href="/login" className="hover:text-brand transition-colors flex items-center gap-1.5">
                  <LockIcon size={14} className="text-muted-foreground" />
                  <span>Masuk Dashboard Pengelola</span>
                </Link>
              </li>
              <li>
                <a
                  href="https://wa.me/6281234567890?text=Halo%20Pengelola%20KosKu,%20saya%20ingin%20bertanya%20informasi%20sewa%20kamar..."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-700 transition-colors flex items-center gap-1.5 text-emerald-600 font-semibold"
                >
                  <WhatsAppIcon size={14} />
                  <span>Hubungi WhatsApp Pengelola</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bar Bawah Copyright */}
        <div className="mt-12 pt-6 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} KosKu. Seluruh hak cipta dilindungi.</p>
          <p className="flex items-center gap-2">
            <span>Dikelola dengan cermat dan transparan untuk kenyamanan Anda</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
