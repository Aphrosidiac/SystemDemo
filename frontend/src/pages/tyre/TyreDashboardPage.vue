<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-lg font-semibold text-dark-100">Tyre Stock</h2>
      <div class="flex items-center gap-3">
        <input v-model="search" type="text" placeholder="Search tyres..." class="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-dark-100 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50 placeholder:text-dark-500 w-64" />
        <span class="text-dark-500 text-xs">Auto-refreshes every 60s</span>
      </div>
    </div>

    <div v-if="loading" class="text-dark-400 text-center py-12">Loading tyre stock...</div>

    <div v-else-if="filteredGroups.length === 0" class="text-dark-500 text-center py-12">No tyre stock found.</div>

    <div v-else class="space-y-6">
      <div v-for="group in filteredGroups" :key="group.tyreSize" class="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden">
        <!-- Size Header -->
        <div class="flex items-center justify-between px-5 py-3 bg-dark-800/50 border-b border-dark-800">
          <h3 class="text-gold-500 font-bold text-sm tracking-wider">{{ group.tyreSize || 'Other' }}</h3>
          <div class="flex items-center gap-3">
            <span class="text-dark-400 text-xs">{{ group.items.length }} item(s)</span>
            <button @click="copyGroup(group)" class="text-dark-400 hover:text-gold-500 transition-colors text-xs flex items-center gap-1" title="Copy group">
              <Copy class="w-3.5 h-3.5" /> Copy
            </button>
          </div>
        </div>

        <!-- Items -->
        <div class="divide-y divide-dark-800">
          <div v-for="item in group.items" :key="item.id" class="flex items-center justify-between px-5 py-3 hover:bg-dark-800/30 transition-colors">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-dark-100 text-sm font-medium">{{ item.brand?.name || '' }}</span>
                <span class="text-dark-300 text-sm">{{ item.description }}</span>
                <span class="text-gold-500 text-sm font-medium">RM{{ Number(item.sellPrice).toFixed(0) }}</span>
              </div>
              <div v-if="item.tyreDots?.length" class="flex flex-wrap gap-2 mt-1">
                <span v-for="dot in item.tyreDots" :key="dot.id" class="text-xs bg-dark-800 border border-dark-700 rounded px-2 py-0.5">
                  <span class="text-dark-400">DOT</span>
                  <span class="text-dark-200 font-mono ml-1">{{ dot.dotCode }}</span>
                  <span class="text-gold-500 ml-1">{{ dot.quantity }}pcs</span>
                </span>
              </div>
              <div v-else class="text-dark-500 text-xs mt-1">No DOT batches</div>
            </div>
            <div class="flex items-center gap-3 ml-4">
              <span class="text-dark-200 text-sm font-semibold">{{ item.quantity }} pcs</span>
              <button @click="copyItem(item)" class="p-1.5 text-dark-400 hover:text-gold-500 transition-colors" title="Copy item">
                <Copy class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast for copy -->
    <div v-if="showCopied" class="fixed bottom-6 right-6 bg-green-600 text-white px-4 py-2 rounded-lg text-sm shadow-lg z-50">
      Copied to clipboard
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import api from '../../lib/api'
import { Copy } from 'lucide-vue-next'

interface TyreDot {
  id: string
  dotCode: string
  quantity: number
}

interface TyreItem {
  id: string
  itemCode: string
  description: string
  sellPrice: number
  costPrice: number
  quantity: number
  brand?: { name: string }
  category?: { name: string }
  tyreDots?: TyreDot[]
}

interface TyreGroup {
  tyreSize: string
  items: TyreItem[]
}

const groups = ref<TyreGroup[]>([])
const loading = ref(true)
const search = ref('')
const showCopied = ref(false)

const filteredGroups = computed(() => {
  if (!search.value) return groups.value
  const q = search.value.toLowerCase()
  return groups.value
    .map((g) => ({
      ...g,
      items: g.items.filter((item) =>
        item.description.toLowerCase().includes(q) ||
        item.itemCode.toLowerCase().includes(q) ||
        (item.brand?.name || '').toLowerCase().includes(q) ||
        g.tyreSize.toLowerCase().includes(q)
      ),
    }))
    .filter((g) => g.items.length > 0)
})

async function fetchTyreStock() {
  try {
    const { data } = await api.get('/tyre-stock')
    groups.value = data.data
  } catch { /* ignore */ } finally {
    loading.value = false
  }
}

function formatItem(item: TyreItem): string {
  const brand = item.brand?.name || ''
  const dots = item.tyreDots?.map((d) => `DOT${d.dotCode}(${d.quantity})`).join(' ') || ''
  return `${brand} ${item.description} - RM${Number(item.sellPrice).toFixed(0)} - ${dots} - ${item.quantity}pcs`
}

function formatGroup(group: TyreGroup): string {
  const lines = [group.tyreSize]
  for (const item of group.items) {
    lines.push(`  ${formatItem(item)}`)
  }
  return lines.join('\n')
}

async function copyItem(item: TyreItem) {
  await navigator.clipboard.writeText(formatItem(item))
  flashCopied()
}

async function copyGroup(group: TyreGroup) {
  await navigator.clipboard.writeText(formatGroup(group))
  flashCopied()
}

function flashCopied() {
  showCopied.value = true
  setTimeout(() => { showCopied.value = false }, 2000)
}

// Auto-refresh every 60s
let refreshInterval: ReturnType<typeof setInterval>
onMounted(() => {
  fetchTyreStock()
  refreshInterval = setInterval(fetchTyreStock, 60000)
})
onUnmounted(() => clearInterval(refreshInterval))
</script>
