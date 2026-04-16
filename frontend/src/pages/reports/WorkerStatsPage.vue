<template>
  <div class="max-w-6xl mx-auto">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-white">Worker Performance</h1>
        <p class="text-sm text-dark-400 mt-1">Compare output across staff over a date range</p>
      </div>
      <div class="flex items-center gap-2">
        <BaseInput v-model="from" type="date" />
        <span class="text-dark-500 text-sm">to</span>
        <BaseInput v-model="to" type="date" />
        <BaseButton variant="secondary" size="sm" @click="fetchStats" :loading="loading">Apply</BaseButton>
      </div>
    </div>

    <div v-if="loading" class="text-dark-400 text-sm">Loading…</div>
    <div v-else-if="!rows.length" class="bg-dark-900 border border-dark-800 rounded-xl p-8 text-center text-dark-400">
      No activity in this range.
    </div>

    <div v-else class="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-dark-800/50 text-dark-400 text-xs uppercase border-b border-dark-800">
          <tr>
            <th class="px-4 py-3 text-left">Staff</th>
            <th class="px-4 py-3 text-right">Invoices</th>
            <th class="px-4 py-3 text-right">Quotations</th>
            <th class="px-4 py-3 text-right">Delivery Orders</th>
            <th class="px-4 py-3 text-right">Jobs Completed</th>
            <th class="px-4 py-3 text-right">Revenue Handled</th>
            <th class="px-4 py-3 text-right">Avg Turnaround</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-dark-800">
          <tr v-for="(r, idx) in rows" :key="r.userId" :class="idx === 0 ? 'bg-gold-500/5' : ''">
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <span v-if="idx === 0" class="text-gold-500 text-xs">★</span>
                <div>
                  <div class="text-white font-medium">{{ r.name }}</div>
                  <div class="text-xs text-dark-500">{{ r.jobTitle || r.role }}</div>
                </div>
              </div>
            </td>
            <td class="px-4 py-3 text-right font-mono text-dark-200">{{ r.invoicesCreated }}</td>
            <td class="px-4 py-3 text-right font-mono text-dark-200">{{ r.quotationsCreated }}</td>
            <td class="px-4 py-3 text-right font-mono text-dark-200">{{ r.deliveryOrders }}</td>
            <td class="px-4 py-3 text-right font-mono text-emerald-400">{{ r.jobsCompleted }}</td>
            <td class="px-4 py-3 text-right font-mono text-gold-500">RM {{ fmtMoney(r.revenueHandled) }}</td>
            <td class="px-4 py-3 text-right font-mono text-dark-300">{{ r.avgTurnaroundMinutes ? fmtMins(r.avgTurnaroundMinutes) : '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../../lib/api'
import BaseInput from '../../components/base/BaseInput.vue'
import BaseButton from '../../components/base/BaseButton.vue'

type Row = {
  userId: string; name: string; jobTitle: string | null; role: string
  invoicesCreated: number; quotationsCreated: number; deliveryOrders: number
  jobsCompleted: number; revenueHandled: number; avgTurnaroundMinutes: number | null
}

const now = new Date()
const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
const defaultTo = now.toISOString().slice(0, 10)

const from = ref(defaultFrom)
const to = ref(defaultTo)
const rows = ref<Row[]>([])
const loading = ref(true)

function fmtMoney(n: number) { return n.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function fmtMins(m: number) {
  const h = Math.floor(m / 60); const mm = m % 60
  return h > 0 ? `${h}h ${mm}m` : `${mm}m`
}

async function fetchStats() {
  loading.value = true
  try {
    const { data } = await api.get('/reports/worker-stats', { params: { from: from.value, to: to.value } })
    rows.value = data.data
  } finally { loading.value = false }
}

onMounted(fetchStats)
</script>
