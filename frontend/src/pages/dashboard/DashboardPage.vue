<template>
  <div>
    <div v-if="dashboard.loading" class="text-dark-400">Loading dashboard...</div>

    <div v-else-if="dashboard.error" class="bg-red-900/20 border border-red-800 rounded-xl p-6 text-center">
      <p class="text-red-400">{{ dashboard.error }}</p>
      <button @click="dashboard.fetchAll()" class="mt-3 text-sm text-gold-500 hover:text-gold-400">Retry</button>
    </div>

    <template v-else-if="dashboard.stats">
      <!-- Quick Actions -->
      <div class="flex items-center gap-2 mb-6">
        <RouterLink to="/app/documents/new?type=INVOICE" class="inline-flex items-center gap-1.5 bg-gold-500 text-dark-950 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gold-400 transition-colors">
          <Plus class="w-4 h-4" /> New Invoice
        </RouterLink>
        <RouterLink to="/app/documents/new?type=QUOTATION" class="inline-flex items-center gap-1.5 bg-dark-800 text-dark-200 border border-dark-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-dark-700 transition-colors">
          <Plus class="w-4 h-4" /> New Quotation
        </RouterLink>
        <a href="/app/shop-display" target="_blank" class="inline-flex items-center gap-1.5 bg-dark-800 text-gold-500 border border-gold-500/30 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gold-500/10 transition-colors ml-auto">
          <Monitor class="w-4 h-4" /> Shop Display
        </a>
      </div>

      <!-- Stats Row 1 — Revenue -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Revenue Today" :value="'RM ' + dashboard.stats.revenueToday.toFixed(2)" icon="trending-up" color="green" />
        <StatCard label="Revenue This Month" :value="'RM ' + dashboard.stats.revenueThisMonth.toFixed(2)" icon="trending-up" color="gold" />
        <StatCard label="Invoices Today" :value="dashboard.stats.invoicesToday" icon="file-text" color="blue" />
        <StatCard label="Invoices This Month" :value="dashboard.stats.invoicesThisMonth" icon="file-text" color="blue" />
      </div>

      <!-- Stats Row 2 — Counts & Alerts -->
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard label="Total Stock Items" :value="dashboard.stats.totalItems" icon="package" color="gray" />
        <StatCard label="Total Customers" :value="dashboard.stats.totalCustomers" icon="users" color="gray" />
        <StatCard label="Outstanding" :value="dashboard.stats.outstandingInvoices" icon="clock" color="gold" :alert="dashboard.stats.outstandingInvoices > 0" />
        <StatCard label="Overdue" :value="dashboard.stats.overdueInvoices" icon="alert" color="red" :alert="dashboard.stats.overdueInvoices > 0" />
        <StatCard label="Drafts" :value="dashboard.stats.draftDocuments" icon="edit" color="gray" />
      </div>

      <!-- Charts Row -->
      <div class="grid lg:grid-cols-3 gap-6 mb-6">
        <!-- Revenue Chart (2/3) -->
        <div class="lg:col-span-2 bg-dark-900 border border-dark-800 rounded-xl p-6">
          <h3 class="text-sm font-semibold text-dark-200 uppercase tracking-wider mb-4">Revenue (Last 7 Days)</h3>
          <div class="h-64">
            <Bar v-if="revenueChartData" :data="revenueChartData" :options="chartOptions" />
          </div>
        </div>

        <!-- Document Breakdown (1/3) -->
        <div class="bg-dark-900 border border-dark-800 rounded-xl p-6">
          <h3 class="text-sm font-semibold text-dark-200 uppercase tracking-wider mb-4">Documents</h3>
          <div class="h-64 flex items-center justify-center">
            <Doughnut v-if="docChartData" :data="docChartData" :options="doughnutOptions" />
          </div>
        </div>
      </div>

      <!-- Action Items + Activity -->
      <div class="grid lg:grid-cols-3 gap-6 mb-6">
        <!-- Action Items (2/3) -->
        <div class="lg:col-span-2 space-y-4">
          <!-- Overdue -->
          <BaseCard v-if="dashboard.actionItems?.overdue?.length" title="Overdue Invoices">
            <div class="space-y-2">
              <RouterLink
                v-for="inv in dashboard.actionItems.overdue"
                :key="inv.id"
                :to="`/app/documents/${inv.id}`"
                class="flex items-center justify-between py-2 border-b border-dark-800 last:border-0 hover:bg-dark-800/30 -mx-2 px-2 rounded transition-colors"
              >
                <div>
                  <span class="font-mono text-red-400 text-sm">{{ inv.documentNumber }}</span>
                  <span class="text-dark-400 text-sm ml-2">{{ inv.customerName }}</span>
                </div>
                <div class="text-right">
                  <span class="text-dark-200 text-sm font-medium">RM {{ (Number(inv.totalAmount) - Number(inv.paidAmount)).toFixed(2) }}</span>
                  <p class="text-red-400 text-xs">Due {{ fmtDate(inv.dueDate) }}</p>
                </div>
              </RouterLink>
            </div>
          </BaseCard>

          <!-- Pending Quotations -->
          <BaseCard v-if="dashboard.actionItems?.pendingQuotations?.length" title="Pending Quotations">
            <div class="space-y-2">
              <RouterLink
                v-for="qt in dashboard.actionItems.pendingQuotations"
                :key="qt.id"
                :to="`/app/documents/${qt.id}`"
                class="flex items-center justify-between py-2 border-b border-dark-800 last:border-0 hover:bg-dark-800/30 -mx-2 px-2 rounded transition-colors"
              >
                <div>
                  <span class="font-mono text-gold-500 text-sm">{{ qt.documentNumber }}</span>
                  <span class="text-dark-400 text-sm ml-2">{{ qt.customerName }}</span>
                  <BaseBadge :color="qt.status === 'APPROVED' ? 'green' : 'blue'" class="ml-2">{{ qt.status }}</BaseBadge>
                </div>
                <span class="text-dark-200 text-sm font-medium">RM {{ Number(qt.totalAmount).toFixed(2) }}</span>
              </RouterLink>
            </div>
          </BaseCard>

          <!-- Low Stock -->
          <BaseCard v-if="dashboard.lowStock?.length" title="Low Stock Alert">
            <template #header-action>
              <BaseBadge color="red">{{ dashboard.lowStock.length }}</BaseBadge>
            </template>
            <div class="space-y-2 max-h-48 overflow-y-auto">
              <div v-for="item in dashboard.lowStock" :key="item.id" class="flex items-center justify-between py-2 border-b border-dark-800 last:border-0">
                <div>
                  <span class="font-mono text-gold-500 text-sm">{{ item.itemCode }}</span>
                  <span class="text-dark-300 text-sm ml-2">{{ item.description }}</span>
                </div>
                <span class="text-red-400 font-semibold text-sm">{{ item.quantity }} left</span>
              </div>
            </div>
          </BaseCard>
        </div>

        <!-- Activity Feed (1/3) -->
        <div class="bg-dark-900 border border-dark-800 rounded-xl p-6">
          <h3 class="text-sm font-semibold text-dark-200 uppercase tracking-wider mb-4">Recent Activity</h3>
          <div v-if="!dashboard.activities?.length" class="text-dark-500 text-sm text-center py-8">No recent activity.</div>
          <div v-else class="space-y-3">
            <div v-for="(a, i) in dashboard.activities" :key="i" class="flex gap-3">
              <div class="mt-1">
                <div :class="[
                  'w-2 h-2 rounded-full',
                  a.type === 'payment' ? 'bg-green-500' : a.type === 'stock' ? 'bg-blue-500' : 'bg-gold-500',
                ]" />
              </div>
              <div class="flex-1 min-w-0">
                <component :is="a.link ? 'RouterLink' : 'p'" :to="a.link" class="text-dark-300 text-xs leading-relaxed break-words" :class="a.link && 'hover:text-gold-500'">
                  {{ a.description }}
                </component>
                <p class="text-dark-600 text-xs mt-0.5">
                  {{ timeAgo(a.date) }}{{ a.by ? ` · ${a.by}` : '' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Invoices -->
      <BaseCard title="Recent Invoices">
        <template #header-action>
          <RouterLink to="/app/documents?type=INVOICE" class="text-gold-500 text-xs hover:text-gold-400">View all</RouterLink>
        </template>
        <div v-if="!dashboard.recentInvoices.length" class="text-dark-500 text-sm py-4 text-center">No invoices yet.</div>
        <div v-else class="space-y-2 max-h-64 overflow-y-auto">
          <RouterLink
            v-for="inv in dashboard.recentInvoices"
            :key="inv.id"
            :to="`/app/documents/${inv.id}`"
            class="flex items-center justify-between py-2 border-b border-dark-800 last:border-0 hover:bg-dark-800/30 -mx-2 px-2 rounded transition-colors"
          >
            <div>
              <span class="font-mono text-gold-500 text-sm">{{ inv.documentNumber }}</span>
              <span class="text-dark-500 text-xs ml-2">{{ fmtDate(inv.issueDate) }}</span>
              <span v-if="inv.customerName" class="text-dark-400 text-xs ml-2">— {{ inv.customerName }}</span>
            </div>
            <div class="flex items-center gap-3">
              <BaseBadge :color="statusColor(inv.status)">{{ inv.status }}</BaseBadge>
              <span class="text-dark-200 text-sm font-medium">RM {{ Number(inv.totalAmount).toFixed(2) }}</span>
            </div>
          </RouterLink>
        </div>
      </BaseCard>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useDashboardStore } from '../../stores/dashboard'
import BaseCard from '../../components/base/BaseCard.vue'
import BaseBadge from '../../components/base/BaseBadge.vue'
import { Plus, Monitor } from 'lucide-vue-next'
import { Bar, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement,
  Title, Tooltip, Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

const dashboard = useDashboardStore()

// ─── Stat Card Component ───────────────────────────────────
const StatCard = {
  props: ['label', 'value', 'icon', 'color', 'alert'],
  template: `
    <div :class="['bg-dark-900 border rounded-xl p-5', alert ? 'border-red-800/50' : 'border-dark-800']">
      <p class="text-2xl font-bold text-dark-100">{{ value }}</p>
      <p class="text-xs text-dark-400 mt-1">{{ label }}</p>
    </div>
  `,
}

// ─── Charts ────────────────────────────────────────────────
const revenueChartData = computed(() => {
  if (!dashboard.revenueChart.length) return null
  return {
    labels: dashboard.revenueChart.map((d) => {
      const date = new Date(d.date)
      return date.toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric' })
    }),
    datasets: [{
      label: 'Revenue (RM)',
      data: dashboard.revenueChart.map((d) => d.revenue),
      backgroundColor: 'rgba(255, 215, 0, 0.3)',
      borderColor: 'rgba(255, 215, 0, 0.8)',
      borderWidth: 2,
      borderRadius: 6,
    }],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#111217',
      borderColor: '#2e303a',
      borderWidth: 1,
      titleColor: '#FFD700',
      bodyColor: '#e1e2e5',
      callbacks: {
        label: (ctx: any) => `RM ${ctx.raw.toFixed(2)}`,
      },
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(46, 48, 58, 0.5)' },
      ticks: { color: '#6b6e7a', font: { size: 11 } },
    },
    y: {
      grid: { color: 'rgba(46, 48, 58, 0.5)' },
      ticks: {
        color: '#6b6e7a',
        font: { size: 11 },
        callback: (v: any) => `RM ${v}`,
      },
      beginAtZero: true,
    },
  },
}

const docChartData = computed(() => {
  const breakdown = dashboard.stats?.documentBreakdown
  if (!breakdown || Object.keys(breakdown).length === 0) return null
  const labels: Record<string, string> = {
    QUOTATION: 'Quotations',
    INVOICE: 'Invoices',
    RECEIPT: 'Receipts',
    DELIVERY_ORDER: 'Delivery Orders',
  }
  const colors: Record<string, string> = {
    QUOTATION: '#3b82f6',
    INVOICE: '#FFD700',
    RECEIPT: '#22c55e',
    DELIVERY_ORDER: '#a855f7',
  }
  const keys = Object.keys(breakdown)
  return {
    labels: keys.map((k) => labels[k] || k),
    datasets: [{
      data: keys.map((k) => breakdown[k]),
      backgroundColor: keys.map((k) => colors[k] || '#6b6e7a'),
      borderWidth: 0,
    }],
  }
})

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '65%',
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: { color: '#a4a7b0', font: { size: 11 }, padding: 12, usePointStyle: true, pointStyleWidth: 8 },
    },
    tooltip: {
      backgroundColor: '#111217',
      borderColor: '#2e303a',
      borderWidth: 1,
      titleColor: '#FFD700',
      bodyColor: '#e1e2e5',
    },
  },
}

// ─── Helpers ───────────────────────────────────────────────
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-MY')
}

function statusColor(status: string) {
  if (status === 'PAID') return 'green' as const
  if (status === 'VOID' || status === 'OVERDUE') return 'red' as const
  if (status === 'OUTSTANDING' || status === 'PARTIAL') return 'gold' as const
  return 'gray' as const
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

onMounted(() => dashboard.fetchAll())
</script>
