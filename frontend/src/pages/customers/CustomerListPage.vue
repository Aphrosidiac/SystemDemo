<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div class="relative flex-1 max-w-md">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
        <input
          v-model="search"
          @input="debouncedFetch"
          type="text"
          placeholder="Search by name or phone..."
          class="w-full bg-dark-800 border border-dark-700 rounded-lg pl-10 pr-3 py-2 text-dark-100 text-sm placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500"
        />
      </div>
      <BaseButton variant="primary" size="md" @click="$router.push('/app/customers/new')">
        <Plus class="w-4 h-4 mr-1.5" /> Add Customer
      </BaseButton>
    </div>

    <BaseTable :columns="columns" :data="store.customers" :loading="store.loading" empty-text="No customers yet.">
      <template #cell-name="{ value, row }">
        <RouterLink :to="`/app/customers/${row.id}/edit`" class="text-gold-500 hover:text-gold-400 font-medium">{{ value }}</RouterLink>
      </template>
      <template #cell-phone="{ value }">
        {{ value || '—' }}
      </template>
      <template #cell-vehicles="{ row }">
        <div v-if="row.vehicles?.length" class="flex flex-wrap gap-1">
          <span v-for="v in row.vehicles" :key="v.id" class="text-xs bg-dark-800 text-dark-300 px-2 py-0.5 rounded font-mono">
            {{ v.plate }}
          </span>
        </div>
        <span v-else class="text-dark-500 text-sm">—</span>
      </template>
      <template #cell-_count="{ row }">
        {{ row._count?.documents || 0 }}
      </template>
      <template #actions="{ row }">
        <div class="flex items-center gap-1 justify-end">
          <RouterLink :to="`/app/customers/${row.id}/edit`" class="p-1.5 text-dark-400 hover:text-gold-500 transition-colors">
            <Pencil class="w-4 h-4" />
          </RouterLink>
          <button v-if="!row._count?.documents" @click="handleDelete(row)" class="p-1.5 text-dark-400 hover:text-red-400 transition-colors">
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </template>
    </BaseTable>

    <BasePagination
      :page="store.page"
      :total="store.total"
      :limit="store.limit"
      @update:page="(p) => { store.page = p; fetchData() }"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useCustomerStore } from '../../stores/customers'
import { useToast } from '../../composables/useToast'
import BaseButton from '../../components/base/BaseButton.vue'
import BaseTable from '../../components/base/BaseTable.vue'
import BasePagination from '../../components/base/BasePagination.vue'
import { Search, Plus, Pencil, Trash2 } from 'lucide-vue-next'

const store = useCustomerStore()
const toast = useToast()
const search = ref('')

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'vehicles', label: 'Vehicles' },
  { key: '_count', label: 'Documents' },
]

let timer: ReturnType<typeof setTimeout>
function debouncedFetch() {
  clearTimeout(timer)
  timer = setTimeout(() => { store.page = 1; fetchData() }, 300)
}

function fetchData() {
  store.fetchCustomers({ search: search.value || undefined })
}

async function handleDelete(row: any) {
  if (!confirm(`Delete customer "${row.name}"?`)) return
  try {
    await store.deleteCustomer(row.id)
    toast.success('Customer deleted')
    fetchData()
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Failed to delete')
  }
}

onMounted(() => fetchData())
onUnmounted(() => clearTimeout(timer))
</script>
