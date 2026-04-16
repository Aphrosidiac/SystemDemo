export interface User {
  id: string
  email: string
  name: string
  phone?: string
  jobTitle?: string
  role: 'ADMIN' | 'MANAGER' | 'WORKER'
  branchId: string
  isActive?: boolean
  _count?: { foremanDocuments: number }
  createdAt?: string
}

export interface Branch {
  id: string
  name: string
  code: string
  address?: string
  phone?: string
  email?: string
}

export interface StockCategory {
  id: string
  name: string
  code?: string
  sortOrder: number
  branchId: string
  _count?: { items: number; brands: number }
}

export interface Brand {
  id: string
  branchId: string
  categoryId: string
  name: string
  code?: string
  logoUrl?: string
  sortOrder: number
  isActive: boolean
  category?: { id: string; name: string }
  _count?: { items: number }
}

export interface StockItem {
  id: string
  itemCode: string
  description: string
  uom: string
  costPrice: number
  sellPrice: number
  quantity: number
  holdQuantity: number
  minStock: number
  categoryId?: string
  brandId?: string
  category?: StockCategory
  brand?: Brand
  countryOfOrigin?: string
  dotCode?: string
  dotWeek?: number
  dotYear?: number
  isTyre?: boolean
  tyreSize?: string
  branchId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ─── DOCUMENTS ─────────────────────────────────────────────
export type DocumentType = 'QUOTATION' | 'INVOICE' | 'RECEIPT' | 'DELIVERY_ORDER'

export type DocumentStatus =
  | 'DRAFT' | 'PENDING' | 'APPROVED' | 'SENT'
  | 'OUTSTANDING' | 'PARTIAL' | 'PAID' | 'OVERDUE'
  | 'COMPLETED' | 'CANCELLED' | 'VOID'

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'CREDIT_CARD' | 'EWALLET' | 'TNG' | 'BOOST'

export interface DocumentItem {
  id: string
  documentId: string
  stockItemId?: string
  itemCode?: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  discountPercent: number
  taxRate: number
  subtotal: number
  taxAmount: number
  total: number
  sortOrder: number
  serviceDate?: string
  serviceReminderSent?: boolean
}

export interface Payment {
  id: string
  documentId: string
  amount: number
  paymentMethod: PaymentMethod
  referenceNumber?: string
  notes?: string
  bankName?: string
  createdBy?: { name: string }
  createdAt: string
}

export interface Document {
  id: string
  branchId: string
  documentType: DocumentType
  documentNumber: string
  customerName?: string
  customerCompanyName?: string
  customerPhone?: string
  customerEmail?: string
  vehiclePlate?: string
  vehicleModel?: string
  vehicleMileage?: string
  vehicleColor?: string
  vehicleEngineNo?: string
  issueDate: string
  dueDate?: string
  status: DocumentStatus
  subtotal: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
  paidAmount: number
  notes?: string
  terms?: string
  footerNote?: string
  createdBy?: User
  foremanId?: string
  foreman?: { id: string; name: string; jobTitle?: string; phone?: string }
  items?: DocumentItem[]
  payments?: Payment[]
  convertedFromId?: string
  convertedFromType?: DocumentType
  conversionTargets?: DocumentType[]
  _count?: { items: number; payments: number }
  createdAt: string
  updatedAt: string
}

export interface DocumentSetting {
  id: string
  branchId: string
  documentType: DocumentType
  prefix: string
  nextNumber: number
  paddingLength: number
  includeYear: boolean
  yearFormat: string
  separator: string
  template: string
  templateColor: string
  documentLabel?: string
  footerNotes?: string
  documentSize: string
  logoScale: number
  defaultNotes?: string
  defaultTerms?: string
  defaultPaymentTermDays: number
}

export interface PaymentTerm {
  id: string
  branchId: string
  name: string
  days: number
  description?: string
  isDefault: boolean
  isActive: boolean
}

// ─── CUSTOMER & VEHICLE ────────────────────────────────────
export interface Vehicle {
  id: string
  customerId: string
  plate: string
  make?: string
  model?: string
  color?: string
  engineNo?: string
  mileage?: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface Customer {
  id: string
  branchId: string
  name: string
  companyName?: string
  phone?: string
  email?: string
  vehicles?: Vehicle[]
  _count?: { documents: number }
  createdAt: string
  updatedAt: string
}

// ─── STOCK HISTORY ─────────────────────────────────────────
export type StockMovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'HOLD' | 'RELEASE'

export interface StockHistory {
  id: string
  branchId: string
  stockItemId: string
  type: StockMovementType
  quantity: number
  previousQty: number
  newQty: number
  reason: string
  documentId?: string
  document?: { documentNumber: string }
  stockItem?: { itemCode: string; description: string }
  createdBy?: { name: string }
  createdAt: string
}

export interface DocumentFormData {
  documentType: DocumentType
  customerId?: string
  vehicleId?: string
  customerName?: string
  customerCompanyName?: string
  customerPhone?: string
  customerEmail?: string
  vehiclePlate?: string
  vehicleModel?: string
  vehicleMileage?: string
  vehicleColor?: string
  vehicleEngineNo?: string
  foremanId?: string
  issueDate?: string
  dueDate?: string
  notes?: string
  terms?: string
  footerNote?: string
  discountAmount?: number
  items: {
    stockItemId?: string
    itemCode?: string
    description: string
    quantity: number
    unit?: string
    unitPrice: number
    discountPercent?: number
    taxRate?: number
    sortOrder?: number
    serviceDate?: string
  }[]
}

// ─── DASHBOARD ─────────────────────────────────────────────
export interface DashboardStats {
  totalItems: number
  totalStockQty: number
  invoicesToday: number
  invoicesThisMonth: number
  quotationsThisMonth: number
  revenueToday: number
  revenueThisMonth: number
}

// ─── GENERIC ───────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}
