import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../lib/api'
import type { StockItem, StockCategory, StockHistory, Brand, PaginatedResponse } from '../types'

export const useStockStore = defineStore('stock', () => {
  const items = ref<StockItem[]>([])
  const categories = ref<StockCategory[]>([])
  const total = ref(0)
  const page = ref(1)
  const limit = ref(20)
  const totalPages = ref(0)
  const loading = ref(false)

  async function fetchItems(params: Record<string, any> = {}) {
    loading.value = true
    try {
      const { data } = await api.get<PaginatedResponse<StockItem>>('/stock', { params: { page: page.value, limit: limit.value, ...params } })
      items.value = data.data
      total.value = data.total
      totalPages.value = data.totalPages
    } finally {
      loading.value = false
    }
  }

  async function fetchCategories() {
    const { data } = await api.get('/categories')
    categories.value = data.data
  }

  async function createItem(payload: Partial<StockItem>) {
    const { data } = await api.post('/stock', payload)
    return data.data
  }

  async function updateItem(id: string, payload: Partial<StockItem>) {
    const { data } = await api.put(`/stock/${id}`, payload)
    return data.data
  }

  async function deleteItem(id: string) {
    await api.delete(`/stock/${id}`)
  }

  async function getItem(id: string): Promise<StockItem> {
    const { data } = await api.get(`/stock/${id}`)
    return data.data
  }

  // Categories
  async function createCategory(payload: { name: string; code?: string }) {
    const { data } = await api.post('/categories', payload)
    categories.value.push(data.data)
    return data.data
  }

  async function updateCategory(id: string, payload: { name?: string; code?: string }) {
    const { data } = await api.put(`/categories/${id}`, payload)
    const idx = categories.value.findIndex((c) => c.id === id)
    if (idx !== -1) categories.value[idx] = data.data
    return data.data
  }

  async function deleteCategory(id: string) {
    await api.delete(`/categories/${id}`)
    categories.value = categories.value.filter((c) => c.id !== id)
  }

  // Brands
  const brands = ref<Brand[]>([])

  async function fetchBrands(categoryId?: string) {
    const params = categoryId ? { categoryId } : {}
    const { data } = await api.get('/brands', { params })
    brands.value = data.data
  }

  async function createBrand(payload: { categoryId: string; name: string; code?: string; logoUrl?: string; sortOrder?: number }) {
    const { data } = await api.post('/brands', payload)
    brands.value.push(data.data)
    return data.data
  }

  async function updateBrand(id: string, payload: Partial<Brand>) {
    const { data } = await api.put(`/brands/${id}`, payload)
    const idx = brands.value.findIndex((b) => b.id === id)
    if (idx !== -1) brands.value[idx] = data.data
    return data.data
  }

  async function deleteBrand(id: string) {
    await api.delete(`/brands/${id}`)
    brands.value = brands.value.filter((b) => b.id !== id)
  }

  // Stock History
  const history = ref<StockHistory[]>([])
  const historyTotal = ref(0)
  const historyPage = ref(1)
  const historyTotalPages = ref(0)
  const historyLoading = ref(false)

  async function fetchHistory(itemId: string, params: Record<string, any> = {}) {
    historyLoading.value = true
    try {
      const { data } = await api.get<PaginatedResponse<StockHistory>>(`/stock/${itemId}/history`, {
        params: { page: historyPage.value, limit: limit.value, ...params },
      })
      history.value = data.data
      historyTotal.value = data.total
      historyTotalPages.value = data.totalPages
    } finally {
      historyLoading.value = false
    }
  }

  async function fetchAllHistory(params: Record<string, any> = {}) {
    historyLoading.value = true
    try {
      const { data } = await api.get<PaginatedResponse<StockHistory>>('/stock/history', {
        params: { page: historyPage.value, limit: limit.value, ...params },
      })
      history.value = data.data
      historyTotal.value = data.total
      historyTotalPages.value = data.totalPages
    } finally {
      historyLoading.value = false
    }
  }

  async function adjustStock(itemId: string, type: 'add' | 'remove', quantity: number, reason: string) {
    const { data } = await api.post(`/stock/${itemId}/adjust`, { type, quantity, reason })
    return data.data
  }

  return {
    items, categories, brands, total, page, limit, totalPages, loading,
    fetchItems, fetchCategories, createItem, updateItem, deleteItem, getItem,
    createCategory, updateCategory, deleteCategory,
    fetchBrands, createBrand, updateBrand, deleteBrand,
    history, historyTotal, historyPage, historyTotalPages, historyLoading,
    fetchHistory, fetchAllHistory, adjustStock,
  }
})
