<template>
  <div class="max-w-6xl mx-auto">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-white">Held Stock</h1>
      <p class="text-sm text-dark-400 mt-1">Items reserved by draft invoices, grouped by category</p>
    </div>

    <div v-if="loading" class="text-dark-400 text-sm">Loading…</div>
    <div v-else-if="!groups.length" class="bg-dark-900 border border-dark-800 rounded-xl p-8 text-center text-dark-400">
      No items currently on hold.
    </div>

    <div v-else class="space-y-4">
      <div v-for="g in groups" :key="g.categoryId ?? 'none'" class="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden">
        <button @click="toggle(g.categoryId ?? 'none')" class="w-full px-5 py-3 flex items-center justify-between hover:bg-dark-800/30 transition-colors">
          <div class="flex items-center gap-3">
            <ChevronDown class="w-4 h-4 text-dark-400 transition-transform" :class="expanded[g.categoryId ?? 'none'] ? 'rotate-0' : '-rotate-90'" />
            <span class="text-white font-medium">{{ g.categoryName }}</span>
            <span class="text-xs text-dark-500">{{ g.items.length }} items · {{ totalHeld(g) }} on hold</span>
          </div>
        </button>
        <div v-show="expanded[g.categoryId ?? 'none']" class="border-t border-dark-800">
          <div v-for="item in g.items" :key="item.id" class="px-5 py-3 border-b border-dark-800/50 last:border-0">
            <div class="flex items-center justify-between">
              <div>
                <span v-if="item.itemCode" class="text-gold-500 font-mono text-xs mr-2">{{ item.itemCode }}</span>
                <span class="text-white text-sm">{{ item.description }}</span>
              </div>
              <div class="flex items-center gap-4 text-xs">
                <span class="text-dark-400">Stock: <span class="text-dark-200 font-mono">{{ item.quantity }} {{ item.uom }}</span></span>
                <span class="text-amber-400">Held: <span class="font-mono">{{ item.holdQuantity }}</span></span>
              </div>
            </div>
            <div v-if="item.holders.length" class="mt-2 pl-4 space-y-1">
              <div v-for="h in item.holders" :key="h.documentId" class="flex items-center justify-between text-xs">
                <div class="flex items-center gap-2">
                  <RouterLink :to="`/app/documents/${h.documentId}`" class="text-gold-500 hover:text-gold-400 font-mono">{{ h.documentNumber }}</RouterLink>
                  <span class="text-dark-500">·</span>
                  <span class="text-dark-300">{{ h.customerName || 'Walk-in' }}</span>
                  <span v-if="h.vehiclePlate" class="text-dark-500">· {{ h.vehiclePlate }}</span>
                  <span v-if="h.foreman" class="text-dark-500">· {{ h.foreman }}</span>
                </div>
                <span class="text-amber-400 font-mono">{{ h.quantity }} {{ item.uom }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import api from '../../lib/api'
import { ChevronDown } from 'lucide-vue-next'

type Holder = { documentId: string; documentNumber: string; customerName: string | null; vehiclePlate: string | null; foreman: string | null; quantity: number }
type Item = { id: string; itemCode: string | null; description: string; uom: string; quantity: number; holdQuantity: number; holders: Holder[] }
type Group = { categoryId: string | null; categoryName: string; items: Item[] }

const groups = ref<Group[]>([])
const loading = ref(true)
const expanded = reactive<Record<string, boolean>>({})

function toggle(key: string) { expanded[key] = !expanded[key] }
function totalHeld(g: Group) { return g.items.reduce((s, i) => s + i.holdQuantity, 0) }

onMounted(async () => {
  try {
    const { data } = await api.get('/stock/held')
    groups.value = data.data
    for (const g of groups.value) expanded[g.categoryId ?? 'none'] = true
  } finally { loading.value = false }
})
</script>
