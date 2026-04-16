<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-lg font-semibold text-dark-100">Purchase Orders</h2>
      <BaseButton variant="primary" size="sm" @click="$router.push('/app/purchase-orders/new')">
        <Plus class="w-4 h-4 mr-1" /> New Purchase Order
      </BaseButton>
    </div>

    <!-- Filters -->
    <div class="flex items-end gap-4 mb-6 flex-wrap">
      <div class="flex-1 max-w-xs">
        <label class="block text-xs text-dark-400 mb-1">Search</label>
        <input v-model="search" type="text" placeholder="Invoice no, supplier..." class="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-dark-100 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50 placeholder:text-dark-500" />
      </div>
      <div>
        <label class="block text-xs text-dark-400 mb-1">Status</label>
        <select v-model="filterStatus" class="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-dark-100 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50">
          <option value="">All</option>
          <option value="ON_HOLD">On Hold</option>
          <option value="VERIFIED">Verified</option>
          <option value="FINALIZED">Finalized</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>
    </div>

    <!-- Table -->
    <BaseTable :columns="columns" :data="invoices" :loading="loading" empty-text="No purchase invoices found.">
      <template #cell-internalNumber="{ row }">
        <RouterLink :to="`/app/purchase-orders/${row.id}`" class="text-dark-100 hover:text-gold-500 font-medium font-mono transition-colors">
          {{ row.internalNumber }}
        </RouterLink>
      </template>
      <template #cell-supplier="{ row }">
        <span class="text-dark-300 text-sm">{{ row.supplier?.companyName || '-' }}</span>
      </template>
      <template #cell-invoiceNumber="{ value }">
        <span class="text-dark-400 text-sm">{{ value }}</span>
      </template>
      <template #cell-status="{ value }">
        <BaseBadge :color="value === 'FINALIZED' ? 'green' : value === 'VERIFIED' ? 'blue' : value === 'CANCELLED' ? 'red' : 'gold'">
          {{ value.replace('_', ' ') }}
        </BaseBadge>
      </template>
      <template #cell-totalAmount="{ value }">
        <span class="text-dark-200 font-medium">RM {{ Number(value).toFixed(2) }}</span>
      </template>
      <template #cell-issueDate="{ value }">
        <span class="text-dark-400 text-sm">{{ formatDate(value) }}</span>
      </template>
      <template #actions="{ row }">
        <RouterLink :to="`/app/purchase-orders/${row.id}`" class="p-1.5 text-dark-400 hover:text-gold-500 transition-colors">
          <Eye class="w-4 h-4" />
        </RouterLink>
      </template>
    </BaseTable>

    <BasePagination v-if="totalPages > 1" :page="page" :total="totalPages * 20" :limit="20" @update:page="(p: number) => { page = p; fetchInvoices() }" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import api from '../../lib/api'
import BaseTable from '../../components/base/BaseTable.vue'
import BaseButton from '../../components/base/BaseButton.vue'
import BaseBadge from '../../components/base/BaseBadge.vue'
import BasePagination from '../../components/base/BasePagination.vue'
import { Plus, Eye } from 'lucide-vue-next'

const invoices = ref<any[]>([])
const loading = ref(true)
const search = ref('')
const filterStatus = ref('')
const page = ref(1)
const totalPages = ref(1)

const columns = [
  { key: 'internalNumber', label: 'PI No.' },
  { key: 'supplier', label: 'Supplier' },
  { key: 'invoiceNumber', label: 'Supplier Inv#' },
  { key: 'status', label: 'Status' },
  { key: 'totalAmount', label: 'Total' },
  { key: 'issueDate', label: 'Date' },
]

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
}

let searchTimeout: ReturnType<typeof setTimeout>
watch([search, filterStatus], () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => { page.value = 1; fetchInvoices() }, 300)
})

async function fetchInvoices() {
  loading.value = true
  try {
    const params: Record<string, any> = { page: page.value }
    if (search.value) params.search = search.value
    if (filterStatus.value) params.status = filterStatus.value
    const { data } = await api.get('/purchase-invoices', { params })
    invoices.value = data.data
    totalPages.value = data.totalPages || 1
  } catch { /* ignore */ } finally {
    loading.value = false
  }
}

onMounted(() => fetchInvoices())
</script>
