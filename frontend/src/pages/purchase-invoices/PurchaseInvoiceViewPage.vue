<template>
  <div class="max-w-4xl">
    <div class="flex items-center gap-3 mb-6">
      <button @click="$router.back()" class="text-dark-400 hover:text-dark-200 transition-colors">
        <ArrowLeft class="w-5 h-5" />
      </button>
      <h2 class="text-lg font-semibold text-dark-100">{{ pi?.internalNumber || 'Purchase Order' }}</h2>
      <BaseBadge v-if="pi" :color="statusColor">{{ pi.status.replace('_', ' ') }}</BaseBadge>
    </div>

    <div v-if="loading" class="text-dark-400">Loading...</div>

    <template v-else-if="pi">
      <!-- Actions -->
      <div class="flex items-center gap-3 mb-6">
        <BaseButton v-if="pi.status === 'ON_HOLD'" variant="secondary" size="sm" @click="$router.push(`/app/purchase-orders/${pi.id}/edit`)">
          <Pencil class="w-4 h-4 mr-1" /> Edit
        </BaseButton>
        <BaseButton v-if="pi.status === 'ON_HOLD'" variant="primary" size="sm" @click="handleCheckAll" :loading="actionLoading">
          <CheckCheck class="w-4 h-4 mr-1" /> Check All
        </BaseButton>
        <BaseButton v-if="pi.status === 'ON_HOLD' && allChecked" variant="primary" size="sm" @click="handleVerify" :loading="actionLoading">
          Verify
        </BaseButton>
        <BaseButton v-if="pi.status === 'VERIFIED'" variant="primary" size="sm" @click="handleFinalize" :loading="actionLoading">
          Finalize (Update Stock)
        </BaseButton>
        <BaseButton v-if="['ON_HOLD', 'VERIFIED'].includes(pi.status)" variant="danger" size="sm" @click="handleCancel" :loading="actionLoading">
          Cancel
        </BaseButton>
      </div>

      <!-- Document Template -->
      <div id="document-template" class="bg-white text-gray-900 overflow-hidden max-w-3xl mx-auto border border-gray-300 print:max-w-full print:shadow-none print:border-none mb-6" style="width: 800px;">
        <!-- Header -->
        <div class="px-8 pt-6 pb-4 flex items-start justify-between">
          <img src="/logo-doc.svg" alt="SystemDemo" class="h-16" />
          <div class="text-right text-xs text-gray-700">
            <p class="text-sm font-bold text-gray-900">SYSTEMDEMO</p>
            <p class="mt-1">22, Jalan Mutiara Emas 5/1, Demo Plaza,</p>
            <p>50000 Kuala Lumpur</p>
          </div>
        </div>
        <div class="border-t-2 border-gray-900 mx-8"></div>

        <!-- Title + Meta -->
        <div class="px-8 py-4">
          <div class="flex justify-between mb-4">
            <h2 class="text-xl font-bold text-gray-900 uppercase">Purchase Order</h2>
            <div class="text-right text-sm space-y-0.5">
              <p><span class="text-gray-500">No:</span> <strong>{{ pi.internalNumber }}</strong></p>
              <p><span class="text-gray-500">Date:</span> {{ formatDate(pi.issueDate) }}</p>
              <p v-if="pi.receivedDate"><span class="text-gray-500">Received:</span> {{ formatDate(pi.receivedDate) }}</p>
              <p v-if="pi.invoiceNumber"><span class="text-gray-500">Supplier Inv#:</span> {{ pi.invoiceNumber }}</p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-6 text-sm border-t border-gray-200 pt-3">
            <div>
              <p class="text-gray-500 text-xs uppercase font-semibold mb-1">Supplier</p>
              <p class="font-medium">{{ pi.supplier?.companyName }}</p>
              <p v-if="pi.supplier?.contactName" class="text-gray-600 text-xs mt-0.5">{{ pi.supplier.contactName }}</p>
              <p v-if="pi.supplier?.phone" class="text-gray-500 text-xs">Tel: {{ pi.supplier.phone }}</p>
              <p v-if="pi.supplier?.email" class="text-gray-500 text-xs">{{ pi.supplier.email }}</p>
            </div>
            <div>
              <p class="text-gray-500 text-xs uppercase font-semibold mb-1">Status</p>
              <p class="font-medium">{{ pi.status.replace('_', ' ') }}</p>
              <p class="text-gray-500 text-xs mt-0.5">{{ checkedCount }}/{{ pi.items?.length || 0 }} items checked</p>
            </div>
          </div>
        </div>

        <!-- Items -->
        <div class="px-8 py-2">
          <table class="w-full text-sm border-collapse">
            <thead>
              <tr class="border-t border-b border-gray-900">
                <th class="text-left py-2 font-semibold w-8 print:hidden"></th>
                <th class="text-left py-2 font-semibold w-8">No</th>
                <th class="text-left py-2 font-semibold">Description</th>
                <th class="text-center py-2 font-semibold w-12">Qty</th>
                <th class="text-right py-2 font-semibold w-20">Price RM</th>
                <th class="text-right py-2 font-semibold w-24">Amount RM</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in (pi.items as any[])" :key="item.id" class="border-b border-gray-200">
                <td class="py-2 print:hidden">
                  <button v-if="pi.status === 'ON_HOLD'" @click="toggleCheck(item)">
                    <div :class="['w-4 h-4 rounded border flex items-center justify-center transition-colors', item.isChecked ? 'bg-emerald-600 border-emerald-600' : 'border-gray-400']">
                      <Check v-if="item.isChecked" class="w-2.5 h-2.5 text-white" />
                    </div>
                  </button>
                  <div v-else :class="['w-4 h-4 rounded border flex items-center justify-center', item.isChecked ? 'bg-emerald-600 border-emerald-600' : 'border-gray-400']">
                    <Check v-if="item.isChecked" class="w-2.5 h-2.5 text-white" />
                  </div>
                </td>
                <td class="py-2">{{ idx + 1 }}</td>
                <td class="py-2">
                  <span v-if="item.itemCode" class="font-mono text-gray-500 text-xs">{{ item.itemCode }} </span>
                  {{ item.description }}
                  <span v-if="item.dotCode" class="inline-block ml-1 px-1.5 py-0.5 text-[10px] font-mono bg-gray-900 text-white rounded">DOT{{ item.dotCode }}</span>
                  <span v-if="item.brandName" class="block text-gray-400 text-xs mt-0.5">Brand: {{ item.brandName }}</span>
                </td>
                <td class="py-2 text-center">{{ item.quantity }}</td>
                <td class="py-2 text-right">{{ Number(item.unitPrice).toFixed(2) }}</td>
                <td class="py-2 text-right font-medium">{{ Number(item.total).toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Totals + Notes -->
        <div class="px-8 py-4">
          <div class="border-t border-gray-900"></div>
          <div class="flex justify-between items-start mt-3">
            <div class="text-xs text-gray-600 max-w-[55%]">
              <p v-if="pi.notes" class="whitespace-pre-line">{{ pi.notes }}</p>
            </div>
            <div class="w-56 space-y-1 text-sm">
              <div class="flex justify-between border-2 border-gray-900 px-3 py-1.5 font-bold">
                <span>Total</span><span>{{ Number(pi.totalAmount).toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Signature -->
        <div class="px-8 py-6 grid grid-cols-2 gap-12 text-xs">
          <div class="border-t border-gray-400 pt-1 text-center">Received by</div>
          <div class="border-t border-gray-400 pt-1 text-center">Authorised signature</div>
        </div>
      </div>

      <!-- Attachments -->
      <div class="bg-dark-900 border border-dark-800 rounded-xl p-6">
        <h3 class="text-sm font-semibold text-dark-200 uppercase tracking-wider mb-4">Attachments</h3>
        <div v-if="!pi.attachments?.length" class="text-dark-500 text-sm">No attachments.</div>
        <div v-else class="space-y-2">
          <div v-for="a in pi.attachments" :key="a.id" class="flex items-center gap-3 text-sm">
            <Paperclip class="w-4 h-4 text-dark-400" />
            <a :href="a.fileUrl" target="_blank" class="text-blue-400 hover:text-blue-300">{{ a.fileName }}</a>
            <span class="text-dark-500 text-xs">{{ (a.fileSize / 1024).toFixed(0) }} KB</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '../../composables/useToast'
import api from '../../lib/api'
import BaseButton from '../../components/base/BaseButton.vue'
import BaseBadge from '../../components/base/BaseBadge.vue'
import { ArrowLeft, Pencil, CheckCheck, Check, Paperclip } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const pi = ref<any>(null)
const loading = ref(true)
const actionLoading = ref(false)

const statusColor = computed(() => {
  const s = pi.value?.status
  if (s === 'FINALIZED') return 'green'
  if (s === 'VERIFIED') return 'blue'
  if (s === 'CANCELLED') return 'red'
  return 'gold'
})

const allChecked = computed(() => pi.value?.items?.every((i: any) => i.isChecked))
const checkedCount = computed(() => pi.value?.items?.filter((i: any) => i.isChecked).length || 0)

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
}

async function fetchPI() {
  loading.value = true
  try {
    const { data } = await api.get(`/purchase-invoices/${route.params.id}`)
    pi.value = data.data
  } catch {
    toast.error('Failed to load purchase invoice')
    router.push('/app/purchase-orders')
  } finally {
    loading.value = false
  }
}

async function toggleCheck(item: any) {
  try {
    await api.patch(`/purchase-invoices/${pi.value.id}/items/${item.id}/check`)
    item.isChecked = !item.isChecked
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Failed to update')
  }
}

async function handleCheckAll() {
  actionLoading.value = true
  try {
    await api.patch(`/purchase-invoices/${pi.value.id}/check-all`)
    await fetchPI()
    toast.success('All items checked')
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Failed')
  } finally {
    actionLoading.value = false
  }
}

async function handleVerify() {
  actionLoading.value = true
  try {
    await api.post(`/purchase-invoices/${pi.value.id}/verify`)
    await fetchPI()
    toast.success('Invoice verified')
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Failed')
  } finally {
    actionLoading.value = false
  }
}

async function handleFinalize() {
  if (!confirm('This will update stock quantities. Are you sure?')) return
  actionLoading.value = true
  try {
    await api.post(`/purchase-invoices/${pi.value.id}/finalize`)
    await fetchPI()
    toast.success('Invoice finalized — stock updated')
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Failed')
  } finally {
    actionLoading.value = false
  }
}

async function handleCancel() {
  if (!confirm('Cancel this purchase invoice?')) return
  actionLoading.value = true
  try {
    await api.post(`/purchase-invoices/${pi.value.id}/cancel`)
    await fetchPI()
    toast.success('Invoice cancelled')
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Failed')
  } finally {
    actionLoading.value = false
  }
}

onMounted(() => fetchPI())
</script>
