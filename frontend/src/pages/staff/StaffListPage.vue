<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-lg font-semibold text-dark-100">Staff Management</h2>
      <div class="flex items-center gap-2">
        <BaseButton variant="secondary" size="sm" @click="showRoles = true">
          <ShieldCheck class="w-4 h-4 mr-1" /> Roles
        </BaseButton>
        <BaseButton variant="primary" size="sm" @click="openCreateModal">
          <Plus class="w-4 h-4 mr-1" /> Add Staff
        </BaseButton>
      </div>
    </div>

    <!-- Roles Access Modal -->
    <BaseModal v-model="showRoles" title="Role Access Matrix" size="lg">
      <div class="space-y-4">
        <p class="text-xs text-dark-400">
          Pages each role can access. This reflects the current app configuration; to change it, edit <code class="text-dark-200">router/index.ts</code> and <code class="text-dark-200">DashboardLayout.vue</code>.
        </p>
        <div class="overflow-auto border border-dark-800 rounded-lg max-h-[60vh]">
          <table class="w-full text-sm">
            <thead class="bg-dark-800/50 text-dark-400 text-xs uppercase border-b border-dark-800">
              <tr>
                <th class="px-4 py-2.5 text-left">Page</th>
                <th class="px-4 py-2.5 text-center w-20">Admin</th>
                <th class="px-4 py-2.5 text-center w-20">Manager</th>
                <th class="px-4 py-2.5 text-center w-20">Worker</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-dark-800">
              <tr v-for="p in accessMatrix" :key="p.path">
                <td class="px-4 py-2">
                  <div class="text-dark-100 text-sm">{{ p.label }}</div>
                  <div class="text-[10px] text-dark-500 font-mono">{{ p.path }}</div>
                </td>
                <td class="px-4 py-2 text-center">
                  <Check v-if="p.roles.includes('ADMIN')" class="w-4 h-4 text-emerald-500 mx-auto" />
                  <X v-else class="w-4 h-4 text-dark-600 mx-auto" />
                </td>
                <td class="px-4 py-2 text-center">
                  <Check v-if="p.roles.includes('MANAGER')" class="w-4 h-4 text-emerald-500 mx-auto" />
                  <X v-else class="w-4 h-4 text-dark-600 mx-auto" />
                </td>
                <td class="px-4 py-2 text-center">
                  <Check v-if="p.roles.includes('WORKER')" class="w-4 h-4 text-emerald-500 mx-auto" />
                  <X v-else class="w-4 h-4 text-dark-600 mx-auto" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <template #footer>
        <BaseButton variant="secondary" @click="showRoles = false">Close</BaseButton>
      </template>
    </BaseModal>

    <!-- Filters -->
    <div class="flex items-end gap-4 mb-6">
      <div class="flex-1 max-w-xs">
        <label class="block text-xs text-dark-400 mb-1">Search</label>
        <input v-model="search" type="text" placeholder="Name, email, phone..." class="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-dark-100 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50 placeholder:text-dark-500" />
      </div>
      <div>
        <label class="block text-xs text-dark-400 mb-1">Role</label>
        <select v-model="filterRole" class="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-dark-100 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50">
          <option value="">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="MANAGER">Manager</option>
          <option value="WORKER">Worker</option>
        </select>
      </div>
    </div>

    <!-- Table -->
    <BaseTable :columns="columns" :data="staff" :loading="loading" empty-text="No staff found.">
      <template #cell-name="{ row }">
        <div>
          <span class="text-dark-100 font-medium">{{ row.name }}</span>
          <span v-if="!row.isActive" class="ml-2 text-xs text-red-400">(Inactive)</span>
        </div>
      </template>
      <template #cell-email="{ value }">
        <span class="text-dark-300 text-sm">{{ value }}</span>
      </template>
      <template #cell-phone="{ value }">
        <span class="text-dark-400 text-sm">{{ value || '-' }}</span>
      </template>
      <template #cell-jobTitle="{ value }">
        <span v-if="value" class="text-dark-300 text-sm">{{ value }}</span>
        <span v-else class="text-dark-500 text-sm">-</span>
      </template>
      <template #cell-role="{ value }">
        <BaseBadge :color="value === 'ADMIN' ? 'red' : value === 'MANAGER' ? 'blue' : 'gold'">
          {{ value }}
        </BaseBadge>
      </template>
      <template #cell-orders="{ row }">
        <span class="text-dark-400 text-sm">{{ row._count?.foremanDocuments || 0 }}</span>
      </template>
      <template #actions="{ row }">
        <div class="flex items-center gap-1">
          <button @click="openEditModal(row as User)" class="p-1.5 text-dark-400 hover:text-blue-400 transition-colors">
            <Pencil class="w-4 h-4" />
          </button>
          <button @click="openResetModal(row as User)" class="p-1.5 text-dark-400 hover:text-yellow-400 transition-colors" title="Reset Password">
            <KeyRound class="w-4 h-4" />
          </button>
        </div>
      </template>
    </BaseTable>

    <!-- Create/Edit Modal -->
    <BaseModal v-model="showModal" :title="editing ? 'Edit Staff' : 'Add Staff'" size="md">
      <div class="space-y-4">
        <BaseInput v-model="form.name" label="Name" placeholder="Full name" required />
        <BaseInput v-model="form.email" label="Email" type="email" placeholder="email@example.com" required />
        <BaseInput v-if="!editing" v-model="form.password" label="Password" type="password" placeholder="Min 6 characters" required />
        <div class="grid grid-cols-2 gap-4">
          <BaseInput v-model="form.phone" label="Phone" placeholder="+60 12-345 6789" />
          <BaseInput v-model="form.jobTitle" label="Job Title" placeholder="e.g. Foreman, Mechanic" />
        </div>
        <BaseSelect v-model="form.role" label="System Role" required>
          <option value="WORKER">Worker</option>
          <option value="MANAGER">Manager</option>
          <option value="ADMIN">Admin</option>
        </BaseSelect>
        <div v-if="editing" class="flex items-center gap-2">
          <input type="checkbox" v-model="form.isActive" id="active-toggle" class="accent-gold-500" />
          <label for="active-toggle" class="text-dark-300 text-sm">Active (can login)</label>
        </div>
      </div>
      <template #footer>
        <BaseButton variant="secondary" @click="showModal = false">Cancel</BaseButton>
        <BaseButton variant="primary" :loading="saving" @click="handleSave">
          {{ editing ? 'Update' : 'Create' }}
        </BaseButton>
      </template>
    </BaseModal>

    <!-- Reset Password Modal -->
    <BaseModal v-model="showResetModal" title="Reset Password" size="sm">
      <p class="text-dark-300 text-sm mb-4">Set a new password for <strong class="text-dark-100">{{ resetTarget?.name }}</strong></p>
      <BaseInput v-model="newPassword" label="New Password" type="password" placeholder="Min 6 characters" required />
      <template #footer>
        <BaseButton variant="secondary" @click="showResetModal = false">Cancel</BaseButton>
        <BaseButton variant="primary" :loading="resetting" @click="handleResetPassword">Reset Password</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, reactive } from 'vue'
import api from '../../lib/api'
import { useToast } from '../../composables/useToast'
import BaseTable from '../../components/base/BaseTable.vue'
import BaseButton from '../../components/base/BaseButton.vue'
import BaseBadge from '../../components/base/BaseBadge.vue'
import BaseModal from '../../components/base/BaseModal.vue'
import BaseInput from '../../components/base/BaseInput.vue'
import BaseSelect from '../../components/base/BaseSelect.vue'
import { Plus, Pencil, KeyRound, ShieldCheck, Check, X } from 'lucide-vue-next'
import type { User } from '../../types'

const toast = useToast()

const staff = ref<User[]>([])
const showRoles = ref(false)

const accessMatrix = [
  { path: '/app/dashboard', label: 'Dashboard', roles: ['ADMIN', 'MANAGER'] },
  { path: '/app/take-order', label: 'Take Order', roles: ['ADMIN', 'MANAGER'] },
  { path: '/app/stock', label: 'Stock', roles: ['ADMIN', 'MANAGER'] },
  { path: '/app/tyre-dashboard', label: 'Tyre Dashboard', roles: ['ADMIN', 'MANAGER', 'WORKER'] },
  { path: '/app/customers', label: 'Customers', roles: ['ADMIN', 'MANAGER'] },
  { path: '/app/documents', label: 'Documents (QT/INV/RCP/DO)', roles: ['ADMIN', 'MANAGER'] },
  { path: '/app/documents/settings', label: 'Document Settings', roles: ['ADMIN'] },
  { path: '/app/debtors', label: 'Debtors', roles: ['ADMIN', 'MANAGER'] },
  { path: '/app/suppliers', label: 'Suppliers', roles: ['ADMIN', 'MANAGER'] },
  { path: '/app/purchase-orders', label: 'Purchase Orders', roles: ['ADMIN', 'MANAGER'] },
  { path: '/app/supplier-payments', label: 'A/P Payments', roles: ['ADMIN', 'MANAGER'] },
  { path: '/app/reports/payment-log', label: 'Payment Log', roles: ['ADMIN', 'MANAGER'] },
  { path: '/app/held-stock', label: 'Held Stock', roles: ['ADMIN', 'MANAGER'] },
  { path: '/app/worker-stats', label: 'Worker Stats', roles: ['ADMIN', 'MANAGER'] },
  { path: '/app/staff', label: 'Staff Management', roles: ['ADMIN'] },
  { path: '/app/audit', label: 'Audit Logs', roles: ['ADMIN'] },
  { path: '/app/shop-display', label: 'Shop Display (TV)', roles: ['ADMIN', 'MANAGER', 'WORKER'] },
]
const loading = ref(true)
const search = ref('')
const filterRole = ref('')
const saving = ref(false)
const resetting = ref(false)
const showModal = ref(false)
const showResetModal = ref(false)
const editing = ref<string | null>(null)
const resetTarget = ref<User | null>(null)
const newPassword = ref('')

const form = reactive({
  name: '',
  email: '',
  password: '',
  phone: '',
  jobTitle: '',
  role: 'WORKER',
  isActive: true,
})

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'jobTitle', label: 'Job Title' },
  { key: 'role', label: 'Role' },
  { key: 'orders', label: 'Orders' },
]

let searchTimeout: ReturnType<typeof setTimeout>
const debouncedSearch = ref('')
watch(search, (val) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => { debouncedSearch.value = val }, 300)
})

async function fetchStaff() {
  loading.value = true
  try {
    const params: Record<string, string> = { limit: '100' }
    if (debouncedSearch.value) params.search = debouncedSearch.value
    if (filterRole.value) params.role = filterRole.value
    const { data } = await api.get('/staff', { params })
    staff.value = data.data
  } catch { /* ignore */ } finally {
    loading.value = false
  }
}

function openCreateModal() {
  editing.value = null
  form.name = ''
  form.email = ''
  form.password = ''
  form.phone = ''
  form.jobTitle = ''
  form.role = 'WORKER'
  form.isActive = true
  showModal.value = true
}

function openEditModal(s: User) {
  editing.value = s.id
  form.name = s.name
  form.email = s.email
  form.phone = s.phone || ''
  form.jobTitle = s.jobTitle || ''
  form.role = s.role
  form.isActive = s.isActive ?? true
  showModal.value = true
}

function openResetModal(s: User) {
  resetTarget.value = s
  newPassword.value = ''
  showResetModal.value = true
}

async function handleSave() {
  saving.value = true
  try {
    if (editing.value) {
      await api.put(`/staff/${editing.value}`, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        jobTitle: form.jobTitle,
        role: form.role,
        isActive: form.isActive,
      })
      toast.success('Staff updated')
    } else {
      await api.post('/staff', {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        jobTitle: form.jobTitle,
        role: form.role,
      })
      toast.success('Staff created')
    }
    showModal.value = false
    fetchStaff()
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Failed to save')
  } finally {
    saving.value = false
  }
}

async function handleResetPassword() {
  if (!resetTarget.value) return
  resetting.value = true
  try {
    await api.post(`/staff/${resetTarget.value.id}/reset-password`, {
      password: newPassword.value,
    })
    toast.success('Password reset successfully')
    showResetModal.value = false
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Failed to reset password')
  } finally {
    resetting.value = false
  }
}

watch([debouncedSearch, filterRole], () => fetchStaff())
onMounted(() => fetchStaff())
</script>
