<template>
  <div class="flex h-screen bg-dark-950">
    <span class="demo-ribbon">DEMO</span>
    <!-- Mobile overlay -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 bg-black/50 z-40 lg:hidden"
      @click="sidebarOpen = false"
    />

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-50 w-64 bg-dark-900 border-r border-dark-800 flex flex-col transform transition-transform lg:relative lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      ]"
    >
      <!-- Logo -->
      <div class="py-6 px-5 border-b border-dark-800">
        <RouterLink to="/app/dashboard" class="flex justify-center" @click="sidebarOpen = false">
          <img src="/logo.svg" alt="SystemDemo" class="h-20" />
        </RouterLink>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 p-4 space-y-1">
        <RouterLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          @click="sidebarOpen = false"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
          :class="isActive(item.path) ? 'bg-gold-500/10 text-gold-500' : 'text-dark-300 hover:text-dark-100 hover:bg-dark-800'"
        >
          <component :is="item.icon" class="w-5 h-5" />
          {{ item.label }}
        </RouterLink>
      </nav>

      <!-- User -->
      <div class="p-4 border-t border-dark-800">
        <div class="flex items-center gap-3">
          <RouterLink to="/app/profile" @click="sidebarOpen = false" class="w-8 h-8 bg-gold-500/20 rounded-full flex items-center justify-center hover:bg-gold-500/30 transition-colors">
            <span class="text-gold-500 text-xs font-bold">{{ userInitials }}</span>
          </RouterLink>
          <RouterLink to="/app/profile" @click="sidebarOpen = false" class="flex-1 min-w-0 hover:opacity-80 transition-opacity">
            <p class="text-sm font-medium text-dark-100 truncate">{{ auth.user?.name }}</p>
            <p class="text-xs text-dark-400 truncate">{{ auth.user?.email }}</p>
          </RouterLink>
          <button @click="handleLogout" class="text-dark-400 hover:text-red-400 transition-colors">
            <LogOut class="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Top bar -->
      <header class="h-14 border-b border-dark-800 bg-dark-900/50 backdrop-blur-sm flex items-center px-6 gap-4">
        <button @click="sidebarOpen = true" class="lg:hidden text-dark-400 hover:text-dark-200">
          <Menu class="w-5 h-5" />
        </button>
        <h1 class="text-lg font-semibold text-dark-100">{{ pageTitle }}</h1>
      </header>

      <!-- Page content -->
      <main class="flex-1 overflow-y-auto p-6">
        <RouterView />
      </main>
    </div>
    <AssistantWidget />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { LayoutDashboard, Package, Users, FileText, ClipboardList, AlertCircle, BarChart3, UserCog, LogOut, Menu, CircleDot, Truck, CreditCard, ShieldCheck, Archive, TrendingUp } from 'lucide-vue-next'
import AssistantWidget from '../components/AssistantWidget.vue'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const sidebarOpen = ref(false)

const allNavItems = [
  { path: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER'] },
  { path: '/app/take-order', label: 'Take Order', icon: ClipboardList, roles: ['ADMIN', 'MANAGER'] },
  { path: '/app/stock', label: 'Stock', icon: Package, roles: ['ADMIN', 'MANAGER'] },
  { path: '/app/tyre-dashboard', label: 'Tyre Dashboard', icon: CircleDot, roles: ['ADMIN', 'MANAGER', 'WORKER'] },
  { path: '/app/customers', label: 'Customers', icon: Users, roles: ['ADMIN', 'MANAGER'] },
  { path: '/app/documents', label: 'Documents', icon: FileText, roles: ['ADMIN', 'MANAGER'] },
  { path: '/app/debtors', label: 'Debtors', icon: AlertCircle, roles: ['ADMIN', 'MANAGER'] },
  { path: '/app/suppliers', label: 'Suppliers', icon: Truck, roles: ['ADMIN', 'MANAGER'], section: 'Purchasing' },
  { path: '/app/supplier-payments', label: 'A/P Payments', icon: CreditCard, roles: ['ADMIN', 'MANAGER'] },
  { path: '/app/reports/payment-log', label: 'Payment Log', icon: BarChart3, roles: ['ADMIN', 'MANAGER'] },
  { path: '/app/held-stock', label: 'Held Stock', icon: Archive, roles: ['ADMIN', 'MANAGER'] },
  { path: '/app/worker-stats', label: 'Worker Stats', icon: TrendingUp, roles: ['ADMIN', 'MANAGER'] },
  { path: '/app/staff', label: 'Staff', icon: UserCog, roles: ['ADMIN'] },
  { path: '/app/audit', label: 'Audit Logs', icon: ShieldCheck, roles: ['ADMIN'] },
]

const navItems = computed(() =>
  allNavItems.filter((item) => item.roles.includes(auth.user?.role || 'WORKER'))
)

const isActive = (path: string) => route.path.startsWith(path)

const pageTitle = computed(() => {
  const name = route.name as string
  if (name?.startsWith('stock')) return 'Stock Management'
  if (name?.startsWith('staff')) return 'Staff Management'
  if (name?.startsWith('customer')) return 'Customers'
  if (name?.startsWith('document')) return 'Documents'
  if (name?.startsWith('supplier-payment')) return 'A/P Payments'
  if (name?.startsWith('supplier')) return 'Suppliers'
  if (name?.startsWith('purchase-order')) return 'Purchase Orders'
  if (name === 'take-order') return 'Take Order'
  if (name === 'dashboard') return 'Dashboard'
  if (name === 'tyre-dashboard') return 'Tyre Dashboard'
  if (name?.startsWith('debtor')) return 'Debtors'
  if (name === 'payment-log') return 'Payment Log'
  if (name === 'profile') return 'Profile'
  return 'SystemDemo'
})

const userInitials = computed(() => {
  const name = auth.user?.name || ''
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
})

async function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>
