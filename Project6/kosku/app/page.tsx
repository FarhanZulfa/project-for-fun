import { createClient } from "@/lib/supabase/server";
import { PublicHeader } from "@/components/public/public-header";
import { KamarKatalogPublik } from "@/components/public/kamar-katalog-publik";
import { PublicFooter } from "@/components/public/public-footer";
import Link from "next/link";
import { Room } from "@/types/database";
import {
  ShieldIcon,
  ZapIcon,
  CleanIcon,
  KitchenIcon,
  RefrigeratorIcon,
  ParkingIcon,
  LaundryIcon,
  LivingRoomIcon,
  KeyIcon,
  MapPinIcon,
  ClockIcon,
  FileTextIcon,
  GraduationCapIcon,
  StoreIcon,
  UtensilsIcon,
  TrainIcon,
  CheckIcon,
  ArrowRightIcon,
  WhatsAppIcon,
  CreditCardIcon,
} from "@/components/shared/icons";

export const revalidate = 0; // live fresh room availability

export default async function HomePage() {
  const supabase = await createClient();

  // Ambil seluruh kamar
  const { data: roomsData } = await supabase
    .from("rooms")
    .select("*")
    .order("room_number", { ascending: true });

  const sortedRooms: Room[] = (roomsData || []).sort((a, b) =>
    a.room_number.localeCompare(b.room_number, undefined, { numeric: true })
  );

  const availableRoomsCount = sortedRooms.filter((r) => r.status === "kosong").length;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-brand/20">
      {/* Header Publik */}
      <PublicHeader />

      <main className="flex-1 space-y-16 sm:space-y-24 pb-20">
        {/* ==================================================================== */}
        {/* HERO SECTION */}
        {/* ==================================================================== */}
        <section className="relative pt-12 pb-14 sm:pt-20 sm:pb-20 border-b border-border/70 bg-card/40">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-3xl space-y-6">
              {/* Status Ketersediaan Nyata (bukan eyebrow pill) */}
              <div className="flex items-center gap-2.5 text-xs font-semibold text-muted-foreground">
                <span
                  className={`h-2 w-2 rounded-full ${
                    availableRoomsCount > 0 ? "bg-status-kosong" : "bg-status-terisi"
                  }`}
                />
                <span>
                  {availableRoomsCount > 0
                    ? `Kondisi Terkini: ${availableRoomsCount} kamar siap huni dari total ${sortedRooms.length} kamar`
                    : "Kondisi Terkini: Seluruh kamar terisi penuh (antrean WhatsApp aktif)"}
                </span>
              </div>

              {/* Judul Hero - Tegas & Proporsional */}
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.12]">
                Hunian Kos Bersih, Tenang, & Tertib Seperti di Rumah Sendiri
              </h1>

              {/* Deskripsi */}
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                KosKu menyediakan kamar sewa berfasilitas lengkap dengan suasana asri dan tertib keluarga. Pilihan tepat untuk mahasiswa dan pekerja profesional yang mendambakan istirahat berkualitas.
              </p>

              {/* Tombol Aksi Utama */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <a
                  href="#katalog"
                  className="btn-brand inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold shadow-xs touch-manipulation"
                >
                  <span>Lihat Pilihan Kamar ({sortedRooms.length} Kamar)</span>
                  <ArrowRightIcon size={16} />
                </a>

                <a
                  href="https://wa.me/6281234567890?text=Halo%20Pengelola%20KosKu,%20saya%20tertarik%20ingin%20tanya%20informasi%20sewa%20dan%20jadwal%20survey%20kamar..."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors shadow-2xs touch-manipulation"
                >
                  <WhatsAppIcon size={16} className="text-emerald-600" />
                  <span>Hubungi Pengelola via WA</span>
                </a>
              </div>

              {/* 3 Keunggulan Utama (In-flow, clean typography) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-border/80">
                <div className="flex items-start gap-3">
                  <ShieldIcon size={20} className="text-brand shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold text-foreground">Aman & Terjaga</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">CCTV 24 jam & akses kunci mandiri</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <ZapIcon size={20} className="text-brand shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold text-foreground">WiFi Cepat Termasuk</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Fiber optik unlimited untuk kerja & kuliah</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CleanIcon size={20} className="text-brand shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold text-foreground">Bersih & Terawat</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Pembersihan area bersama secara rutin</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* KATALOG KAMAR LIVE DARI SUPABASE */}
        {/* ==================================================================== */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6">
          <KamarKatalogPublik rooms={sortedRooms} />
        </section>

        {/* ==================================================================== */}
        {/* FASILITAS BERSAMA (Editorial Layout, Bukan Generic 6-Card Grid) */}
        {/* ==================================================================== */}
        <section id="fasilitas" className="scroll-mt-20 border-y border-border/60 bg-card/60 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-10">
            <div className="max-w-2xl">
              <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground">
                Kenyamanan Ekstra Tanpa Biaya Tersembunyi
              </h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Setiap penghuni mendapatkan akses penuh ke seluruh fasilitas bersama untuk menunjang kebutuhan sehari-hari tanpa biaya tambahan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="rounded-xl border border-border bg-card p-6 space-y-2.5 shadow-2xs">
                <div className="flex items-center gap-2.5 text-brand">
                  <KitchenIcon size={20} />
                  <h3 className="font-heading text-base font-bold text-foreground">Dapur Bersama Lengkap</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tersedia kompor gas beserta tabung gratis dari pengelola, wastafel cuci piring, dan rak simpan bumbu dapur.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 space-y-2.5 shadow-2xs">
                <div className="flex items-center gap-2.5 text-brand">
                  <RefrigeratorIcon size={20} />
                  <h3 className="font-heading text-base font-bold text-foreground">Kulkas & Dispenser Air</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Kulkas dua pintu untuk menyimpan makanan dan minuman, serta dispenser air galon higienis setiap hari.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 space-y-2.5 shadow-2xs">
                <div className="flex items-center gap-2.5 text-brand">
                  <ParkingIcon size={20} />
                  <h3 className="font-heading text-base font-bold text-foreground">Parkir Aman Berkanopi</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Area parkir motor dan mobil beratap kanopi, berpagar tinggi, serta diawasi kamera CCTV 24 jam.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 space-y-2.5 shadow-2xs">
                <div className="flex items-center gap-2.5 text-brand">
                  <LaundryIcon size={20} />
                  <h3 className="font-heading text-base font-bold text-foreground">Mesin Cuci & Area Jemur</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Mesin cuci otomatis yang dapat digunakan bersama dan area jemur beratap transparan di lantai atas.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 space-y-2.5 shadow-2xs">
                <div className="flex items-center gap-2.5 text-brand">
                  <LivingRoomIcon size={20} />
                  <h3 className="font-heading text-base font-bold text-foreground">Ruang Tamu Bersama</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Sofa dan meja santai untuk menerima kunjungan orang tua, kerabat, atau rekan belajar kelompok.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 space-y-2.5 shadow-2xs">
                <div className="flex items-center gap-2.5 text-brand">
                  <KeyIcon size={20} />
                  <h3 className="font-heading text-base font-bold text-foreground">Akses Mandiri 24 Jam</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Setiap penghuni memegang kunci gerbang masing-masing. Aktivitas fleksibel dengan tetap menjaga ketenangan bersama.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* LOKASI STRATEGIS & TATA TERTIB */}
        {/* ==================================================================== */}
        <section id="lokasi" className="scroll-mt-20 mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Lokasi & Akses */}
            <div className="rounded-2xl border border-border bg-card p-7 space-y-5 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <MapPinIcon size={20} />
                </div>
                <div>
                  <h3 className="font-heading text-xl font-bold text-foreground">
                    Lokasi Strategis & Tenang
                  </h3>
                  <p className="text-xs text-muted-foreground">Akses dekat ke fasilitas publik dan pusat aktivitas harian</p>
                </div>
              </div>

              <div className="space-y-3 pt-1 text-xs text-foreground">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/40">
                  <GraduationCapIcon size={18} className="text-brand shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-foreground">Lingkungan Kampus</strong>
                    <span className="text-muted-foreground">5-10 menit ke universitas dan institut terdekat dengan rute kendaraan yang mudah.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/40">
                  <StoreIcon size={18} className="text-brand shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-foreground">Belanja & Kebutuhan</strong>
                    <span className="text-muted-foreground">100 meter ke minimarket 24 jam dan gerai ATM terdekat.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/40">
                  <UtensilsIcon size={18} className="text-brand shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-foreground">Pusat Kuliner & Laundry</strong>
                    <span className="text-muted-foreground">Dikelilingi warung makan mahasiswa, kafe belajar, dan layanan laundry kiloan.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/40">
                  <TrainIcon size={18} className="text-brand shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-foreground">Akses Transportasi</strong>
                    <span className="text-muted-foreground">Dekat halte angkutan umum dan stasiun transit untuk mobilitas ke pusat kota.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tata Tertib & Kenyamanan */}
            <div className="rounded-2xl border border-border bg-card p-7 space-y-5 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <FileTextIcon size={20} />
                </div>
                <div>
                  <h3 className="font-heading text-xl font-bold text-foreground">
                    Tata Tertib Hunian
                  </h3>
                  <p className="text-xs text-muted-foreground">Komitmen bersama demi ketenangan istirahat seluruh penghuni</p>
                </div>
              </div>

              <div className="space-y-3 pt-1 text-xs text-muted-foreground leading-relaxed">
                <div className="flex items-start gap-3 p-3 rounded-xl border border-border/60 bg-card">
                  <CheckIcon size={16} className="text-status-kosong shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-foreground">Jam Tenang Malam (22.00 - 06.00 WIB)</strong>
                    <span>Menghargai waktu istirahat dan jam belajar penghuni lain dengan menjaga ketenangan suara.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl border border-border/60 bg-card">
                  <CheckIcon size={16} className="text-status-kosong shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-foreground">Aturan Kunjungan Tamu</strong>
                    <span>Tamu diterima di ruang tamu bersama demi kenyamanan dan privasi seluruh warga kos.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl border border-border/60 bg-card">
                  <CheckIcon size={16} className="text-status-kosong shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-foreground">Bebas Asap Rokok di Dalam Kamar</strong>
                    <span>Menjaga sirkulasi udara bersih dan mencegah bahaya kebakaran di ruangan interior.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl border border-border/60 bg-card">
                  <CheckIcon size={16} className="text-status-kosong shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-foreground">Kerapian Fasilitas Bersama</strong>
                    <span>Merapikan kembali peralatan dapur dan mencuci alat makan pribadi setelah digunakan.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* BANNER KHUSUS PENYEWA: CEK TAGIHAN MANDIRI */}
        {/* ==================================================================== */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="rounded-2xl border border-border bg-card p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
            <div className="space-y-2 max-w-xl text-center md:text-left">
              <h3 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
                Sudah Jadi Penghuni KosKu?
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Akses portal mandiri untuk memeriksa status tagihan sewa bulanan, tagihan listrik, menyalin nomor rekening resmi pengelola, dan konfirmasi pembayaran via WhatsApp.
              </p>
            </div>

            <Link
              href="/cek-tagihan"
              className="btn-brand shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold shadow-xs touch-manipulation whitespace-nowrap"
            >
              <CreditCardIcon size={16} />
              <span>Buka Portal Cek Tagihan</span>
              <ArrowRightIcon size={15} />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer Publik */}
      <PublicFooter />
    </div>
  );
}
