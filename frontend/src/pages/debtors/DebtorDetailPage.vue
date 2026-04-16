<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <button @click="$router.back()" class="text-dark-400 hover:text-dark-200 transition-colors">
        <ArrowLeft class="w-5 h-5" />
      </button>
      <div>
        <h2 class="text-lg font-semibold text-dark-100">{{ debtor?.name }}</h2>
        <p v-if="debtor?.phone" class="text-dark-400 text-sm">{{ debtor.phone }}</p>
      </div>
      <div v-if="debtor" class="ml-auto text-right">
        <p class="text-red-400 text-xl font-bold">RM {{ debtor.totalOwed.toFixed(2) }}</p>
        <p class="text-dark-500 text-xs">total outstanding</p>
      </div>
    </div>

    <div v-if="loading" class="text-dark-400">Loading...</div>

    <div v-else-if="debtor" class="space-y-3">
      <div
        v-for="doc in debtor.documents"
        :key="doc.id"
        class="bg-dark-900 border border-dark-800 rounded-xl p-5"
      >
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-3">
            <RouterLink :to="`/app/documents/${doc.id}`" class="text-gold-500 hover:text-gold-400 font-mono text-sm">
              {{ doc.documentNumber }}
            </RouterLink>
            <BaseBadge :color="doc.status === 'OVERDUE' ? 'red' : doc.status === 'PARTIAL' ? 'gold' : 'blue'">
              {{ doc.status }}
            </BaseBadge>
          </div>
          <div class="text-right">
            <p class="text-dark-100 font-semibold">RM {{ (doc.totalAmount - doc.paidAmount).toFixed(2) }}</p>
            <p class="text-dark-500 text-xs">of RM {{ Number(doc.totalAmount).toFixed(2) }}</p>
          </div>
        </div>
        <div class="flex gap-6 text-xs text-dark-400">
          <span>Issued: {{ fmtDate(doc.issueDate) }}</span>
          <span v-if="doc.dueDate">Due: {{ fmtDate(doc.dueDate) }}</span>
          <span v-if="doc.vehiclePlate" class="text-gold-500">{{ doc.vehiclePlate }}</span>
        </div>
        <!-- Payments -->
        <div v-if="doc.payments?.length" class="mt-3 pt-3 border-t border-dark-800 space-y-1.5">
          <div v-for="p in doc.payments" :key="p.id" class="flex justify-between text-xs">
            <span class="text-dark-400">{{ fmtPaymentMethod(p.paymentMethod) }} <span v-if="p.referenceNumber">#{{ p.referenceNumber }}</span></span>
            <span class="text-green-400">-RM {{ Number(p.amount).toFixed(2) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import api from '../../lib/api'
import BaseBadge from '../../components/base/BaseBadge.vue'
import { ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const debtor = ref<any>(null)
const loading = ref(true)

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-MY')
}

function fmtPaymentMethod(m: string) {
  const labels: Record<string, string> = {
    CASH: 'Cash', BANK_TRANSFER: 'Bank Transfer', CHEQUE: 'Cheque',
    CREDIT_CARD: 'Credit Card', EWALLET: 'E-Wallet', TNG: "Touch 'n Go", BOOST: 'Boost',
  }
  return labels[m] || m
}

onMounted(async () => {
  try {
    const { data } = await api.get(`/debtors/${encodeURIComponent(route.params.id as string)}`)
    debtor.value = {
      ...data.data,
      totalOwed: data.data.totalOwed,
      documents: data.data.documents.map((d: any) => ({
        ...d,
        totalAmount: Number(d.totalAmount),
        paidAmount: Number(d.paidAmount),
      })),
    }
  } catch { /* ignore */ } finally {
    loading.value = false
  }
})
</script>
