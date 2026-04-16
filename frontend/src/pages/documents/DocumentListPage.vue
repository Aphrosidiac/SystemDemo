<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <h2 class="text-lg font-semibold text-dark-100">Documents</h2>
      </div>
      <div class="flex items-center gap-2">
        <RouterLink to="/app/documents/settings" class="p-2 text-dark-400 hover:text-gold-500 transition-colors">
          <Settings class="w-5 h-5" />
        </RouterLink>
        <BaseButton variant="primary" size="md" @click="$router.push(`/app/documents/new?type=${activeType}`)">
          <Plus class="w-4 h-4 mr-1.5" /> New {{ store.getDocTypeLabel(activeType) }}
        </BaseButton>
      </div>
    </div>

    <!-- Document Type Tabs -->
    <div class="flex items-center gap-1 mb-4 border-b border-dark-800">
      <button
        v-for="dt in docTypes"
        :key="dt.value"
        @click="switchType(dt.value)"
        :class="[
          'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
          activeType === dt.value
            ? 'text-gold-500 border-gold-500'
            : 'text-dark-400 border-transparent hover:text-dark-200',
        ]"
      >
        {{ dt.label }}
      </button>
    </div>

    <!-- Filters -->
    <div class="flex items-center gap-3 mb-4 flex-wrap">
      <!-- Search -->
      <div class="relative flex-1 min-w-[200px] max-w-sm">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
        <input
          v-model="search"
          @input="debouncedFetch"
          type="text"
          placeholder="Search by number, customer, plate..."
          class="w-full bg-dark-800 border border-dark-700 rounded-lg pl-10 pr-3 py-2 text-dark-100 text-sm placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500"
        />
      </div>
      <!-- Status filter -->
      <select
        v-model="statusFilter"
        @change="fetchData"
        class="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-dark-100 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50"
      >
        <option value="">All Status</option>
        <option v-for="s in availableStatuses" :key="s" :value="s">{{ s }}</option>
      </select>
      <!-- Date range -->
      <input v-model="dateFrom" type="date" @change="fetchData" class="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-dark-100 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50" />
      <span class="text-dark-500 text-sm">to</span>
      <input v-model="dateTo" type="date" @change="fetchData" class="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-dark-100 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50" />
    </div>

    <!-- Table -->
    <BaseTable :columns="columns" :data="store.documents" :loading="store.loading" empty-text="No documents found.">
      <template #cell-documentNumber="{ value, row }">
        <RouterLink :to="`/app/documents/${row.id}`" class="font-mono text-gold-500 hover:text-gold-400">
          {{ value }}
        </RouterLink>
      </template>
      <template #cell-customerName="{ row }">
        <div>
          <span class="text-dark-200">{{ row.customerName || '—' }}</span>
          <span v-if="row.vehiclePlate" class="text-dark-500 text-xs ml-2">({{ row.vehiclePlate }})</span>
        </div>
      </template>
      <template #cell-status="{ value }">
        <BaseBadge :color="store.getStatusColor(value) as any">{{ value }}</BaseBadge>
      </template>
      <template #cell-totalAmount="{ value }">
        RM {{ Number(value).toFixed(2) }}
      </template>
      <template #cell-paidAmount="{ row }">
        <span v-if="row.documentType === 'INVOICE'" :class="Number(row.paidAmount) >= Number(row.totalAmount) ? 'text-green-400' : 'text-dark-300'">
          RM {{ Number(row.paidAmount).toFixed(2) }}
        </span>
        <span v-else class="text-dark-500">—</span>
      </template>
      <template #cell-issueDate="{ value }">
        {{ new Date(value).toLocaleDateString('en-MY') }}
      </template>
      <template #cell-createdBy="{ row }">
        {{ row.createdBy?.name || '—' }}
      </template>
      <template #actions="{ row }">
        <div class="flex items-center gap-1 justify-end">
          <RouterLink :to="`/app/documents/${row.id}`" class="p-1.5 text-dark-400 hover:text-gold-500 transition-colors">
            <Eye class="w-4 h-4" />
          </RouterLink>
          <RouterLink v-if="['DRAFT', 'PENDING'].includes(row.status)" :to="`/app/documents/${row.id}/edit`" class="p-1.5 text-dark-400 hover:text-blue-400 transition-colors">
            <Pencil class="w-4 h-4" />
          </RouterLink>
          <button v-if="['DRAFT', 'CANCELLED'].includes(row.status)" @click="handleDelete(row)" class="p-1.5 text-dark-400 hover:text-red-400 transition-colors">
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </template>
    </BaseTable>

    <!-- Pagination -->
    <BasePagination
      :page="store.page"
      :total="store.total"
      :limit="store.limit"
      @update:page="(p) => { store.page = p; fetchData() }"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useDocumentStore } from '../../stores/documents'
import { useToast } from '../../composables/useToast'
import BaseButton from '../../components/base/BaseButton.vue'
import BaseTable from '../../components/base/BaseTable.vue'
import BasePagination from '../../components/base/BasePagination.vue'
import BaseBadge from '../../components/base/BaseBadge.vue'
import { Search, Plus, Eye, Pencil, Trash2, Settings } from 'lucide-vue-next'
import type { DocumentType } from '../../types'

const store = useDocumentStore()
const toast = useToast()
const route = useRoute()
const router = useRouter()

const activeType = ref<DocumentType>((route.query.type as DocumentType) || 'INVOICE')
const search = ref('')
const statusFilter = ref('')
const dateFrom = ref('')
const dateTo = ref('')

const docTypes = [
  { value: 'QUOTATION' as const, label: 'Quotations' },
  { value: 'INVOICE' as const, label: 'Invoices' },
  { value: 'RECEIPT' as const, label: 'Receipts' },
  { value: 'DELIVERY_ORDER' as const, label: 'Delivery Orders' },
  { value: 'PURCHASE_ORDER' as any, label: 'Purchase Orders' },
]

const availableStatuses = computed(() => {
  const statusMap: Record<DocumentType, string[]> = {
    QUOTATION: ['DRAFT', 'PENDING', 'APPROVED', 'SENT', 'COMPLETED', 'CANCELLED'],
    INVOICE: ['DRAFT', 'OUTSTANDING', 'PARTIAL', 'PAID', 'OVERDUE', 'VOID', 'CANCELLED'],
    RECEIPT: ['COMPLETED', 'CANCELLED'],
    DELIVERY_ORDER: ['DRAFT', 'PENDING', 'APPROVED', 'COMPLETED', 'CANCELLED'],
  }
  return statusMap[activeType.value] || []
})

const columns = computed(() => {
  const base = [
    { key: 'documentNumber', label: 'Document #' },
    { key: 'issueDate', label: 'Date' },
    { key: 'customerName', label: 'Customer' },
    { key: 'status', label: 'Status' },
    { key: 'totalAmount', label: 'Total' },
  ]
  if (activeType.value === 'INVOICE') {
    base.push({ key: 'paidAmount', label: 'Paid' })
  }
  base.push({ key: 'createdBy', label: 'Created By' })
  return base
})

function switchType(type: DocumentType | 'PURCHASE_ORDER') {
  if (type === 'PURCHASE_ORDER') {
    router.push('/app/purchase-orders')
    return
  }
  activeType.value = type
  statusFilter.value = ''
  store.page = 1
  fetchData()
}

let debounceTimer: ReturnType<typeof setTimeout>
function debouncedFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { store.page = 1; fetchData() }, 300)
}

function fetchData() {
  store.fetchDocuments({
    type: activeType.value,
    status: statusFilter.value || undefined,
    search: search.value || undefined,
    from: dateFrom.value || undefined,
    to: dateTo.value || undefined,
  })
}

async function handleDelete(doc: any) {
  if (!confirm(`Delete ${doc.documentNumber}?`)) return
  try {
    await store.deleteDocument(doc.id)
    toast.success('Document deleted')
    fetchData()
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Failed to delete')
  }
}

onMounted(() => fetchData())
onUnmounted(() => clearTimeout(debounceTimer))
</script>
