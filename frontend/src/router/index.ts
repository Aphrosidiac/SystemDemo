import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition || { top: 0 }
  },
  routes: [
    // Root → login
    { path: '/', redirect: '/login' },
    // Auth
    {
      path: '/login',
      name: 'login',
      component: () => import('../pages/auth/LoginPage.vue'),
    },
    // App (auth-guarded)
    {
      path: '/app',
      component: () => import('../layouts/DashboardLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'app-root', redirect: '/app/dashboard' },
        { path: 'dashboard', name: 'dashboard', component: () => import('../pages/dashboard/DashboardPage.vue'), meta: { roles: ['ADMIN', 'MANAGER'] } },
        { path: 'tyre-dashboard', name: 'tyre-dashboard', component: () => import('../pages/tyre/TyreDashboardPage.vue') },
        { path: 'stock', name: 'stock-list', component: () => import('../pages/stock/StockListPage.vue'), meta: { roles: ['ADMIN', 'MANAGER'] } },
        { path: 'stock/new', name: 'stock-create', component: () => import('../pages/stock/StockCreatePage.vue'), meta: { roles: ['ADMIN', 'MANAGER'] } },
        { path: 'stock/:id/edit', name: 'stock-edit', component: () => import('../pages/stock/StockEditPage.vue'), meta: { roles: ['ADMIN', 'MANAGER'] } },
        { path: 'stock/:id/history', name: 'stock-history', component: () => import('../pages/stock/StockHistoryPage.vue'), meta: { roles: ['ADMIN', 'MANAGER'] } },
        { path: 'staff', name: 'staff-list', component: () => import('../pages/staff/StaffListPage.vue'), meta: { roles: ['ADMIN'] } },
        { path: 'audit', name: 'audit-list', component: () => import('../pages/audit/AuditLogPage.vue'), meta: { roles: ['ADMIN'] } },
        { path: 'held-stock', name: 'held-stock', component: () => import('../pages/stock/HeldStockPage.vue'), meta: { roles: ['ADMIN', 'MANAGER'] } },
        { path: 'worker-stats', name: 'worker-stats', component: () => import('../pages/reports/WorkerStatsPage.vue'), meta: { roles: ['ADMIN', 'MANAGER'] } },
        { path: 'customers', name: 'customer-list', component: () => import('../pages/customers/CustomerListPage.vue'), meta: { roles: ['ADMIN', 'MANAGER'] } },
        { path: 'customers/new', name: 'customer-create', component: () => import('../pages/customers/CustomerFormPage.vue'), meta: { roles: ['ADMIN', 'MANAGER'] } },
        { path: 'customers/:id/edit', name: 'customer-edit', component: () => import('../pages/customers/CustomerFormPage.vue'), meta: { roles: ['ADMIN', 'MANAGER'] } },
        { path: 'take-order', name: 'take-order', component: () => import('../pages/documents/TakeOrderPage.vue'), meta: { roles: ['ADMIN', 'MANAGER'] } },
        { path: 'documents', name: 'document-list', component: () => import('../pages/documents/DocumentListPage.vue'), meta: { roles: ['ADMIN', 'MANAGER'] } },
        { path: 'documents/new', name: 'document-create', component: () => import('../pages/documents/DocumentFormPage.vue'), meta: { roles: ['ADMIN', 'MANAGER'] } },
        { path: 'documents/settings', name: 'document-settings', component: () => import('../pages/documents/DocumentSettingsPage.vue'), meta: { roles: ['ADMIN'] } },
        { path: 'documents/:id', name: 'document-view', component: () => import('../pages/documents/DocumentViewPage.vue'), meta: { roles: ['ADMIN', 'MANAGER'] } },
        { path: 'documents/:id/edit', name: 'document-edit', component: () => import('../pages/documents/DocumentFormPage.vue'), meta: { roles: ['ADMIN', 'MANAGER'] } },
        { path: 'debtors', name: 'debtor-list', component: () => import('../pages/debtors/DebtorListPage.vue'), meta: { roles: ['ADMIN', 'MANAGER'] } },
        { path: 'debtors/:id', name: 'debtor-detail', component: () => import('../pages/debtors/DebtorDetailPage.vue'), meta: { roles: ['ADMIN', 'MANAGER'] } },
        { path: 'suppliers', name: 'supplier-list', component: () => import('../pages/suppliers/SupplierListPage.vue'), meta: { roles: ['ADMIN', 'MANAGER'] } },
        { path: 'suppliers/new', name: 'supplier-create', component: () => import('../pages/suppliers/SupplierFormPage.vue'), meta: { roles: ['ADMIN', 'MANAGER'] } },
        { path: 'suppliers/:id/edit', name: 'supplier-edit', component: () => import('../pages/suppliers/SupplierFormPage.vue'), meta: { roles: ['ADMIN', 'MANAGER'] } },
        { path: 'purchase-orders', name: 'purchase-order-list', component: () => import('../pages/purchase-invoices/PurchaseInvoiceListPage.vue'), meta: { roles: ['ADMIN', 'MANAGER'] } },
        { path: 'purchase-orders/new', name: 'purchase-order-create', component: () => import('../pages/purchase-invoices/PurchaseInvoiceFormPage.vue'), meta: { roles: ['ADMIN', 'MANAGER'] } },
        { path: 'purchase-orders/:id', name: 'purchase-order-view', component: () => import('../pages/purchase-invoices/PurchaseInvoiceViewPage.vue'), meta: { roles: ['ADMIN', 'MANAGER'] } },
        { path: 'purchase-orders/:id/edit', name: 'purchase-order-edit', component: () => import('../pages/purchase-invoices/PurchaseInvoiceFormPage.vue'), meta: { roles: ['ADMIN', 'MANAGER'] } },
        // Legacy redirects
        { path: 'purchase-invoices', redirect: '/app/purchase-orders' },
        { path: 'purchase-invoices/new', redirect: '/app/purchase-orders/new' },
        { path: 'purchase-invoices/:id', redirect: (to: any) => `/app/purchase-orders/${to.params.id}` },
        { path: 'purchase-invoices/:id/edit', redirect: (to: any) => `/app/purchase-orders/${to.params.id}/edit` },
        { path: 'supplier-payments', name: 'supplier-payment-list', component: () => import('../pages/supplier-payments/SupplierPaymentListPage.vue'), meta: { roles: ['ADMIN', 'MANAGER'] } },
        { path: 'reports/payment-log', name: 'payment-log', component: () => import('../pages/reports/PaymentLogPage.vue'), meta: { roles: ['ADMIN', 'MANAGER'] } },
        { path: 'profile', name: 'profile', component: () => import('../pages/profile/ProfilePage.vue') },
      ],
    },
    // Shop Display — fullscreen, no layout wrapper
    {
      path: '/app/shop-display',
      name: 'shop-display',
      component: () => import('../pages/display/ShopDisplayPage.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

// Auth guard
router.beforeEach(async (to, _from, next) => {
  const auth = useAuthStore()

  if (to.matched.some((r) => r.meta.requiresAuth)) {
    if (!auth.isAuthenticated) {
      return next('/login')
    }
    if (!auth.user) {
      await auth.fetchProfile()
    }

    // Role-based route guard
    const roles = to.meta.roles as string[] | undefined
    if (roles && auth.user && !roles.includes(auth.user.role)) {
      // Workers redirect to tyre dashboard
      if (auth.user.role === 'WORKER') {
        return next('/app/tyre-dashboard')
      }
      return next('/app/dashboard')
    }
  }

  if (to.name === 'login' && auth.isAuthenticated) {
    // Workers go to tyre dashboard, others to main dashboard
    const defaultRoute = auth.user?.role === 'WORKER' ? '/app/tyre-dashboard' : '/app/dashboard'
    return next(defaultRoute)
  }

  next()
})

export default router
