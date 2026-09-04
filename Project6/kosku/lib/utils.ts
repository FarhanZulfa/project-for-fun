import { format, formatDistanceToNow, differenceInDays, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'

/**
 * Format tanggal ke format Indonesia: "5 Sep 2025"
 */
export function formatTanggal(dateString: string): string {
  return format(parseISO(dateString), 'd MMM yyyy', { locale: id })
}

/**
 * Format mata uang Rupiah: "Rp 1.500.000"
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Hitung berapa hari dari sekarang ke tanggal tertentu.
 * Positif = masih akan datang, Negatif = sudah lewat.
 */
export function hitungSelisihHari(dateString: string): number {
  return differenceInDays(parseISO(dateString), new Date())
}

/**
 * Label relatif: "3 hari lagi", "2 hari yang lalu"
 */
export function labelRelatif(dateString: string): string {
  return formatDistanceToNow(parseISO(dateString), {
    addSuffix: true,
    locale: id,
  })
}

/**
 * Status warna berdasarkan selisih hari jatuh tempo.
 * - Merah: sudah lewat (telat)
 * - Kuning: 3 hari lagi atau kurang
 * - Hijau: masih aman
 */
export function warnaJatuhTempo(dateString: string): 'merah' | 'kuning' | 'hijau' {
  const selisih = hitungSelisihHari(dateString)
  if (selisih < 0) return 'merah'
  if (selisih <= 3) return 'kuning'
  return 'hijau'
}
