// Types yang sesuai dengan skema database Supabase (PostgreSQL)
// Dipakai di seluruh aplikasi untuk type safety

export type UserRole = 'admin' | 'viewer'
export type RoomStatus = 'kosong' | 'terisi' | 'maintenance'
export type RoomType = 'ac' | 'kipas'
export type PaymentStatus = 'lunas' | 'belum_bayar' | 'telat'
export type PaymentType = 'sewa' | 'listrik' | 'air'
export type RentCycle = 'bulanan'

// --- Profiles ---
export interface Profile {
  id: string
  full_name: string
  role: UserRole
  created_at: string
}

// --- Rooms ---
export interface Room {
  id: string
  room_number: string
  room_type: RoomType
  monthly_price: number
  status: RoomStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface RoomInsert {
  room_number: string
  room_type: RoomType
  monthly_price: number
  status?: RoomStatus
  notes?: string | null
}

export interface RoomUpdate {
  room_number?: string
  room_type?: RoomType
  monthly_price?: number
  status?: RoomStatus
  notes?: string | null
  updated_at?: string
}

// --- Tenants ---
export interface Tenant {
  id: string
  room_id: string | null
  full_name: string
  phone_number: string | null
  id_number: string | null
  move_in_date: string
  move_out_date: string | null
  rent_cycle: RentCycle
  is_active: boolean
  created_at: string
  updated_at: string
}

// Tenant dengan data kamar (untuk tampilan list)
export interface TenantWithRoom extends Tenant {
  room: Pick<Room, 'room_number' | 'room_type' | 'monthly_price'> | null
}

export interface TenantInsert {
  room_id: string
  full_name: string
  phone_number?: string | null
  id_number?: string | null
  move_in_date: string
  rent_cycle?: RentCycle
}

export interface TenantUpdate {
  room_id?: string
  full_name?: string
  phone_number?: string | null
  id_number?: string | null
  move_out_date?: string | null
  is_active?: boolean
  updated_at?: string
}

// --- Payments ---
export interface Payment {
  id: string
  tenant_id: string
  room_id: string
  payment_type: PaymentType
  amount: number
  due_date: string
  paid_date: string | null
  status: PaymentStatus
  payment_method: string | null
  notes: string | null
  created_at: string
}

// Payment dengan data penyewa & kamar (untuk tampilan list)
export interface PaymentWithDetails extends Payment {
  tenant: Pick<Tenant, 'full_name'> | null
  room: Pick<Room, 'room_number'> | null
}

export interface PaymentInsert {
  tenant_id: string
  room_id: string
  payment_type: PaymentType
  amount: number
  due_date: string
  paid_date?: string | null
  status?: PaymentStatus
  payment_method?: string | null
  notes?: string | null
}

export interface PaymentUpdate {
  amount?: number
  paid_date?: string | null
  status?: PaymentStatus
  payment_method?: string | null
  notes?: string | null
}

// --- Dashboard ---
export interface DashboardSummary {
  totalKamar: number
  kamarTerisi: number
  kamarKosong: number
  kamarMaintenance: number
  pendapatanBulanIni: number
  totalTunggakan: number
  jumlahTunggakan: number
}

// --- Expenses (Fase 2) ---
export type ExpenseCategory =
  | 'listrik'
  | 'air'
  | 'pemeliharaan'
  | 'kebersihan'
  | 'gaji'
  | 'lainnya'

export interface Expense {
  id: string
  category: ExpenseCategory
  description: string
  amount: number
  expense_date: string
  room_id: string | null
  created_at: string
}

export interface ExpenseInsert {
  category: ExpenseCategory
  description: string
  amount: number
  expense_date?: string
  room_id?: string | null
}

export interface ExpenseUpdate {
  category?: ExpenseCategory
  description?: string
  amount?: number
  expense_date?: string
  room_id?: string | null
}

// --- Profit & Loss Report ---
export interface ProfitLossSummary {
  totalRevenue: number
  totalExpense: number
  netProfit: number
  profitMargin: number
}

