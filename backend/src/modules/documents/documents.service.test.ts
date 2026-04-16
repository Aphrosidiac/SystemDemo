import { describe, it, expect } from 'vitest'
import {
  calculateItemTotals,
  calculateDocumentTotals,
  getValidStatuses,
  getDefaultStatus,
  getConversionTargets,
} from './documents.service.js'

describe('calculateItemTotals', () => {
  it('computes totals for a simple line with no discount/tax', () => {
    const r = calculateItemTotals({ quantity: 2, unitPrice: 150 })
    expect(r).toEqual({ subtotal: 300, taxAmount: 0, total: 300 })
  })

  it('applies discount percent correctly', () => {
    const r = calculateItemTotals({ quantity: 4, unitPrice: 100, discountPercent: 10 })
    // 4*100 = 400, *0.9 = 360
    expect(r.subtotal).toBe(360)
    expect(r.total).toBe(360)
  })

  it('applies tax on the post-discount subtotal', () => {
    const r = calculateItemTotals({ quantity: 1, unitPrice: 1000, discountPercent: 10, taxRate: 6 })
    // subtotal = 900, tax = 54, total = 954
    expect(r.subtotal).toBe(900)
    expect(r.taxAmount).toBe(54)
    expect(r.total).toBe(954)
  })

  it('rounds to 2 decimals', () => {
    const r = calculateItemTotals({ quantity: 3, unitPrice: 33.33, taxRate: 6 })
    // subtotal = 99.99, tax = 6.00 (rounded), total = 105.99
    expect(r.subtotal).toBe(99.99)
    expect(r.taxAmount).toBe(6)
    expect(r.total).toBe(105.99)
  })

  it('treats missing discount/tax as zero', () => {
    const r = calculateItemTotals({ quantity: 1, unitPrice: 50, discountPercent: undefined, taxRate: undefined })
    expect(r).toEqual({ subtotal: 50, taxAmount: 0, total: 50 })
  })
})

describe('calculateDocumentTotals', () => {
  it('sums line subtotals and taxes, subtracts doc-level discount', () => {
    const items = [
      { subtotal: 100, taxAmount: 6, total: 106 },
      { subtotal: 200, taxAmount: 12, total: 212 },
    ]
    const r = calculateDocumentTotals(items, 20)
    expect(r.subtotal).toBe(300)
    expect(r.taxAmount).toBe(18)
    expect(r.totalAmount).toBe(298)
  })

  it('defaults discount to 0', () => {
    const r = calculateDocumentTotals([{ subtotal: 50, taxAmount: 0, total: 50 }])
    expect(r.totalAmount).toBe(50)
  })
})

describe('getValidStatuses', () => {
  it('returns INVOICE-specific statuses', () => {
    expect(getValidStatuses('INVOICE')).toContain('OUTSTANDING')
    expect(getValidStatuses('INVOICE')).toContain('VOID')
    expect(getValidStatuses('INVOICE')).not.toContain('SENT')
  })

  it('receipts only allow COMPLETED / CANCELLED', () => {
    expect(getValidStatuses('RECEIPT')).toEqual(['COMPLETED', 'CANCELLED'])
  })
})

describe('getDefaultStatus', () => {
  it('receipts default to COMPLETED', () => {
    expect(getDefaultStatus('RECEIPT')).toBe('COMPLETED')
  })
  it('other types default to DRAFT', () => {
    expect(getDefaultStatus('INVOICE')).toBe('DRAFT')
    expect(getDefaultStatus('QUOTATION')).toBe('DRAFT')
    expect(getDefaultStatus('DELIVERY_ORDER')).toBe('DRAFT')
  })
})

describe('getConversionTargets', () => {
  it('approved/sent quotations convert to invoice', () => {
    expect(getConversionTargets('QUOTATION', 'APPROVED')).toEqual(['INVOICE'])
    expect(getConversionTargets('QUOTATION', 'SENT')).toEqual(['INVOICE'])
  })

  it('draft quotation cannot convert', () => {
    expect(getConversionTargets('QUOTATION', 'DRAFT')).toEqual([])
  })

  it('paid/partial invoice converts to receipt', () => {
    expect(getConversionTargets('INVOICE', 'PAID')).toContain('RECEIPT')
    expect(getConversionTargets('INVOICE', 'PARTIAL')).toContain('RECEIPT')
  })

  it('outstanding invoice can convert to delivery order', () => {
    expect(getConversionTargets('INVOICE', 'OUTSTANDING')).toContain('DELIVERY_ORDER')
  })

  it('draft invoice has no conversion targets', () => {
    expect(getConversionTargets('INVOICE', 'DRAFT')).toEqual([])
  })
})
