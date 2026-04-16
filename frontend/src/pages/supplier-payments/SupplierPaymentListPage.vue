<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-lg font-semibold text-dark-100">A/P Payments</h2>
      <BaseButton variant="primary" size="sm" @click="showCreateModal = true">
        <Plus class="w-4 h-4 mr-1" /> Record Payment
      </BaseButton>
    </div>

    <!-- Filters -->
    <div class="flex items-end gap-4 mb-6">
      <div class="flex-1 max-w-xs">
        <label class="block text-xs text-dark-400 mb-1">Search</label>
        <input v-model="search" type="text" placeholder="Payment no, supplier..." class="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-dark-100 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50 placeholder:text-dark-500" />
      </div>
      <div>
        <label class="block text-xs text-dark-400 mb-1">From</label>
        <input v-model="filterFrom" type="date" class="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-dark-100 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50" />
      </div>
      <div>
        <label class="block text-xs text-dark-400 mb-1">To</label>
        <input v-model="filterTo" type="date" class="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-dark-100 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50" />
      </div>
    </div>

    <!-- Table -->
    <BaseTable :columns="columns" :data="payments" :loading="loading" empty-text="No payments found.">
      <template #cell-paymentNumber="{ value }">
        <span class="text-dark-100 font-mono font-medium">{{ value }}</span>
      </template>
      <template #cell-supplier="{ row }">
        <span class="text-dark-300 text-sm">{{ row.supplier?.companyName || '-' }}</span>
      </template>
      <template #cell-purchaseInvoice="{ row }">
        <span v-if="row.purchaseInvoice" class="text-dark-400 text-sm font-mono">{{ row.purchaseInvoice.internalNumber }}</span>
        <span v-else class="text-dark-500 text-sm">-</span>
      </template>
      <template #cell-amount="{ value }">
        <span class="text-red-400 font-medium">RM {{ Number(value).toFixed(2) }}</span>
      </template>
      <template #cell-paymentMethod="{ value }">
        <span class="text-dark-300 text-sm">{{ value?.replace('_', ' ') }}</span>
      </template>
      <template #cell-paymentDate="{ value }">
        <span class="text-dark-400 text-sm">{{ formatDate(value) }}</span>
      </template>
      <template #actions="{ row }">
        <button @click="openReceipt(row)" class="p-1.5 text-dark-400 hover:text-gold-500 transition-colors" title="Print receipt">
          <Printer class="w-4 h-4" />
        </button>
        <button @click="handleDelete(row)" class="p-1.5 text-dark-400 hover:text-red-400 transition-colors">
          <Trash2 class="w-4 h-4" />
        </button>
      </template>
    </BaseTable>

    <!-- Printable Receipt -->
    <div v-if="receiptRow" class="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 print:static print:bg-white print:p-0" @click.self="receiptRow = null">
      <div class="bg-white text-black rounded-lg shadow-xl w-[820px] max-w-full max-h-[90vh] overflow-auto print:shadow-none print:rounded-none print:max-h-none">
        <div class="flex items-center justify-end gap-2 p-3 border-b border-gray-200 print:hidden">
          <BaseButton variant="secondary" size="sm" @click="receiptRow = null">Close</BaseButton>
          <BaseButton variant="primary" size="sm" @click="handlePrint"><Printer class="w-4 h-4 mr-1" /> Print</BaseButton>
        </div>
        <div id="ap-receipt" class="p-10 font-sans">
          <div class="flex items-start justify-between border-b-2 border-black pb-4 mb-6">
            <div>
              <img src="/logo-doc.svg" alt="SystemDemo" class="h-14 mb-2" />
              <p class="text-xs text-gray-700 font-semibold">{{ branch?.name || 'SYSTEMDEMO' }}</p>
              <p class="text-[11px] text-gray-600">{{ branch?.address }}</p>
              <p class="text-[11px] text-gray-600">{{ branch?.phone }} · {{ branch?.email }}</p>
              <p v-if="branch?.ssmNumber" class="text-[11px] text-gray-600">SSM: {{ branch?.ssmNumber }}</p>
            </div>
            <div class="text-right">
              <h2 class="text-2xl font-bold tracking-widest">PAYMENT RECEIPT</h2>
              <p class="text-xs text-gray-600 mt-1">A/P Payment Voucher</p>
              <p class="text-sm font-mono mt-2">{{ receiptRow.paymentNumber }}</p>
              <p class="text-xs text-gray-600">{{ formatDate(receiptRow.paymentDate) }}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-8 mb-6 text-sm">
            <div>
              <p class="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Paid To</p>
              <p class="font-semibold">{{ receiptRow.supplier?.companyName || '—' }}</p>
              <p v-if="receiptRow.supplier?.contactName" class="text-xs text-gray-600">{{ receiptRow.supplier?.contactName }}</p>
              <p v-if="receiptRow.supplier?.phone" class="text-xs text-gray-600">{{ receiptRow.supplier?.phone }}</p>
            </div>
            <div>
              <p class="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Payment Details</p>
              <div class="text-xs space-y-0.5">
                <div class="flex justify-between"><span class="text-gray-500">Method</span><span>{{ receiptRow.paymentMethod?.replace('_', ' ') }}</span></div>
                <div v-if="receiptRow.bankName" class="flex justify-between"><span class="text-gray-500">Bank</span><span>{{ receiptRow.bankName }}</span></div>
                <div v-if="receiptRow.referenceNumber" class="flex justify-between"><span class="text-gray-500">Reference</span><span class="font-mono">{{ receiptRow.referenceNumber }}</span></div>
                <div v-if="receiptRow.purchaseInvoice" class="flex justify-between"><span class="text-gray-500">Applied to</span><span class="font-mono">{{ receiptRow.purchaseInvoice.internalNumber }}</span></div>
              </div>
            </div>
          </div>

          <div class="border-t-2 border-b-2 border-black py-4 mb-4">
            <div class="flex items-end justify-between">
              <div>
                <p class="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Amount (in words)</p>
                <p class="text-sm italic">{{ amountInWords(Number(receiptRow.amount)) }}</p>
              </div>
              <div class="text-right">
                <p class="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Total Paid</p>
                <p class="text-3xl font-bold">RM {{ Number(receiptRow.amount).toFixed(2) }}</p>
              </div>
            </div>
          </div>

          <p v-if="receiptRow.notes" class="text-xs text-gray-700 mb-8"><span class="text-gray-500">Notes: </span>{{ receiptRow.notes }}</p>

          <div class="grid grid-cols-2 gap-12 mt-16 text-xs">
            <div>
              <div class="border-t border-gray-400 pt-1 text-center">Prepared by</div>
            </div>
            <div>
              <div class="border-t border-gray-400 pt-1 text-center">Authorised signature</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Payment Modal -->
    <BaseModal v-model="showCreateModal" title="Record Supplier Payment" size="md">
      <div class="space-y-4">
        <BaseSelect v-model="payForm.supplierId" label="Supplier" required>
          <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.companyName }}</option>
        </BaseSelect>
        <BaseInput v-model="payForm.amount" label="Amount (RM)" type="number" step="0.01" min="0.01" required />
        <BaseSelect v-model="payForm.paymentMethod" label="Payment Method" required>
          <option value="CASH">Cash</option>
          <option value="BANK_TRANSFER">Bank Transfer</option>
          <option value="CHEQUE">Cheque</option>
          <option value="CREDIT_CARD">Credit Card</option>
          <option value="TNG">Touch 'n Go</option>
          <option value="BOOST">Boost</option>
        </BaseSelect>
        <BaseInput v-model="payForm.referenceNumber" label="Reference Number" placeholder="Optional" />
        <BaseInput v-model="payForm.bankName" label="Bank Name" placeholder="Optional" />
        <BaseInput v-model="payForm.notes" label="Notes" placeholder="Optional" />
        <BaseInput v-model="payForm.paymentDate" label="Payment Date" type="date" />
      </div>
      <template #footer>
        <BaseButton variant="secondary" @click="showCreateModal = false">Cancel</BaseButton>
        <BaseButton variant="primary" :loading="saving" @click="handleCreate">Record Payment</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import api from '../../lib/api'
import { useToast } from '../../composables/useToast'
import BaseTable from '../../components/base/BaseTable.vue'
import BaseButton from '../../components/base/BaseButton.vue'
import BaseModal from '../../components/base/BaseModal.vue'
import BaseInput from '../../components/base/BaseInput.vue'
import BaseSelect from '../../components/base/BaseSelect.vue'
import { Plus, Trash2, Printer } from 'lucide-vue-next'

const toast = useToast()

const payments = ref<any[]>([])
const suppliers = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const search = ref('')
const filterFrom = ref('')
const filterTo = ref('')
const showCreateModal = ref(false)

const payForm = reactive({
  supplierId: '',
  amount: '',
  paymentMethod: 'BANK_TRANSFER',
  referenceNumber: '',
  bankName: '',
  notes: '',
  paymentDate: new Date().toISOString().split('T')[0],
})

const columns = [
  { key: 'paymentNumber', label: 'Pay No.' },
  { key: 'supplier', label: 'Supplier' },
  { key: 'purchaseInvoice', label: 'PI No.' },
  { key: 'amount', label: 'Amount' },
  { key: 'paymentMethod', label: 'Method' },
  { key: 'paymentDate', label: 'Date' },
]

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
}

let searchTimeout: ReturnType<typeof setTimeout>
watch([search, filterFrom, filterTo], () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => fetchPayments(), 300)
})

async function fetchPayments() {
  loading.value = true
  try {
    const params: Record<string, any> = { limit: 50 }
    if (search.value) params.search = search.value
    if (filterFrom.value) params.from = filterFrom.value
    if (filterTo.value) params.to = filterTo.value
    const { data } = await api.get('/supplier-payments', { params })
    payments.value = data.data
  } catch { /* ignore */ } finally {
    loading.value = false
  }
}

async function fetchSuppliers() {
  try {
    const { data } = await api.get('/suppliers', { params: { limit: 100 } })
    suppliers.value = data.data
  } catch { /* ignore */ }
}

async function handleCreate() {
  saving.value = true
  try {
    await api.post('/supplier-payments', {
      ...payForm,
      amount: Number(payForm.amount),
    })
    toast.success('Payment recorded')
    showCreateModal.value = false
    payForm.amount = ''
    payForm.referenceNumber = ''
    payForm.notes = ''
    fetchPayments()
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Failed to create payment')
  } finally {
    saving.value = false
  }
}

async function handleDelete(payment: any) {
  if (!confirm(`Delete payment ${payment.paymentNumber}?`)) return
  try {
    await api.delete(`/supplier-payments/${payment.id}`)
    toast.success('Payment deleted')
    fetchPayments()
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Failed to delete')
  }
}

const receiptRow = ref<any>(null)
const branch = ref<any>(null)

async function openReceipt(row: any) {
  receiptRow.value = row
  if (!branch.value) {
    try {
      const { data } = await api.get('/profile')
      branch.value = data.data.branch
    } catch { /* ignore */ }
  }
}

function handlePrint() {
  const receiptEl = document.getElementById('ap-receipt')
  if (!receiptEl) return window.print()
  const w = window.open('', '_blank', 'width=900,height=1100')
  if (!w) return window.print()
  w.document.write(`<!doctype html><html><head><title>${receiptRow.value?.paymentNumber || 'Receipt'}</title><script src="https://cdn.tailwindcss.com"><\/script></head><body>${receiptEl.outerHTML}<script>window.onload=()=>{window.print();setTimeout(()=>window.close(),300)}<\/script></body></html>`)
  w.document.close()
}

function amountInWords(amount: number): string {
  // Minimal English number-to-words for RM amounts
  const below20 = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  function under1000(n: number): string {
    if (n === 0) return ''
    if (n < 20) return below20[n]
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + below20[n % 10] : '')
    return below20[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + under1000(n % 100) : '')
  }
  const ringgit = Math.floor(amount)
  const sen = Math.round((amount - ringgit) * 100)
  const ringgitParts: string[] = []
  let r = ringgit
  if (r >= 1_000_000) { ringgitParts.push(under1000(Math.floor(r / 1_000_000)) + ' Million'); r %= 1_000_000 }
  if (r >= 1000) { ringgitParts.push(under1000(Math.floor(r / 1000)) + ' Thousand'); r %= 1000 }
  if (r > 0) ringgitParts.push(under1000(r))
  const ringgitStr = ringgitParts.join(' ') || 'Zero'
  return `Ringgit Malaysia ${ringgitStr}${sen > 0 ? ' and ' + under1000(sen) + ' Sen' : ''} Only`
}

onMounted(() => {
  fetchPayments()
  fetchSuppliers()
})
</script>
