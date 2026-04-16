<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <button @click="$router.push('/app/documents')" class="text-dark-400 hover:text-dark-200 transition-colors">
        <ArrowLeft class="w-5 h-5" />
      </button>
      <h2 class="text-lg font-semibold text-dark-100">Document Settings</h2>
    </div>

    <div class="grid lg:grid-cols-4 gap-6">
      <!-- Sidebar -->
      <div class="space-y-4">
        <div class="bg-dark-900 border border-dark-800 rounded-xl p-4">
          <h3 class="text-sm font-semibold text-dark-200 mb-3">Document Types</h3>
          <div class="space-y-1">
            <button
              v-for="dt in docTypes"
              :key="dt.type"
              @click="selectType(dt.type)"
              :class="[
                'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
                activeType === dt.type ? 'bg-gold-500/10 text-gold-500 font-medium' : 'text-dark-300 hover:bg-dark-800',
              ]"
            >
              <span>{{ dt.label }}</span>
              <span class="font-mono text-xs px-1.5 py-0.5 bg-dark-800 rounded">{{ getPrefix(dt.type) }}</span>
            </button>
          </div>
          <div class="mt-4 pt-4 border-t border-dark-800">
            <button
              @click="activeTab = 'payment-terms'; activeType = ''"
              :class="[
                'w-full flex items-center px-3 py-2 rounded-lg text-sm transition-colors',
                activeTab === 'payment-terms' ? 'bg-gold-500/10 text-gold-500 font-medium' : 'text-dark-300 hover:bg-dark-800',
              ]"
            >
              Payment Terms
            </button>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="lg:col-span-3">
        <!-- Document Type Settings -->
        <template v-if="activeTab === 'settings' && currentSetting">
          <form @submit.prevent="handleSave" class="space-y-6">
            <!-- Number Preview -->
            <div class="bg-dark-900 border border-dark-800 rounded-xl p-6 text-center">
              <p class="text-xs text-dark-400 uppercase tracking-wider mb-2">Next Document Number Preview</p>
              <p class="text-2xl font-bold font-mono text-gold-500">{{ numberPreview }}</p>
            </div>

            <!-- Numbering -->
            <div class="bg-dark-900 border border-dark-800 rounded-xl p-6">
              <h3 class="text-sm font-semibold text-dark-200 uppercase tracking-wider mb-4">Numbering</h3>
              <div class="grid sm:grid-cols-3 gap-4">
                <BaseInput v-model="editForm.prefix" label="Prefix" placeholder="e.g. INV" />
                <BaseInput v-model="editForm.separator" label="Separator" placeholder="-" />
                <BaseInput v-model.number="editForm.paddingLength" label="Padding Length" type="number" min="1" max="10" />
                <BaseInput v-model.number="editForm.nextNumber" label="Next Number" type="number" min="1" />
                <BaseSelect v-model="editForm.yearFormat" label="Year Format">
                  <option value="YY">2-digit (26)</option>
                  <option value="YYYY">4-digit (2026)</option>
                </BaseSelect>
                <div class="flex items-end pb-1">
                  <label class="flex items-center gap-2 text-sm text-dark-200 cursor-pointer">
                    <input v-model="editForm.includeYear" type="checkbox" class="rounded bg-dark-800 border-dark-600 text-gold-500 focus:ring-gold-500/50" />
                    Include Year
                  </label>
                </div>
              </div>
            </div>

            <!-- Template -->
            <div class="bg-dark-900 border border-dark-800 rounded-xl p-6">
              <h3 class="text-sm font-semibold text-dark-200 uppercase tracking-wider mb-4">Template</h3>
              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-dark-200 mb-1.5">Template Color</label>
                  <div class="flex items-center gap-2">
                    <input v-model="editForm.templateColor" type="color" class="w-10 h-10 rounded cursor-pointer bg-transparent border-0" />
                    <input v-model="editForm.templateColor" type="text" class="flex-1 bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-dark-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gold-500/50" />
                  </div>
                </div>
                <BaseInput v-model="editForm.documentLabel" label="Custom Label" :placeholder="store.getDocTypeLabel(activeType as any)" />
                <BaseSelect v-model="editForm.documentSize" label="Document Size">
                  <option value="A5">A5 (148 x 210mm)</option>
                  <option value="A4">A4 (210 x 297mm)</option>
                </BaseSelect>
              </div>
            </div>

            <!-- Defaults -->
            <div class="bg-dark-900 border border-dark-800 rounded-xl p-6">
              <h3 class="text-sm font-semibold text-dark-200 uppercase tracking-wider mb-4">Default Content</h3>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-dark-200 mb-1.5">Default Notes</label>
                  <textarea v-model="editForm.defaultNotes" rows="3" class="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2.5 text-dark-100 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50 resize-none" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-dark-200 mb-1.5">Default Terms</label>
                  <textarea v-model="editForm.defaultTerms" rows="3" class="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2.5 text-dark-100 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50 resize-none" />
                </div>
                <BaseInput v-model.number="editForm.defaultPaymentTermDays" label="Default Payment Term (days)" type="number" min="0" />
                <div>
                  <label class="block text-sm font-medium text-dark-200 mb-1.5">Footer Notes</label>
                  <input v-model="editForm.footerNotes" class="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2.5 text-dark-100 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50" placeholder="e.g. Thank you for choosing SystemDemo!" />
                </div>
              </div>
            </div>

            <BaseButton variant="primary" type="submit" :loading="saving" size="lg" class="w-full">Save Settings</BaseButton>
          </form>
        </template>

        <!-- Payment Terms -->
        <template v-if="activeTab === 'payment-terms'">
          <div class="bg-dark-900 border border-dark-800 rounded-xl p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-semibold text-dark-200 uppercase tracking-wider">Payment Terms</h3>
              <BaseButton variant="primary" size="sm" @click="showTermModal = true">
                <Plus class="w-4 h-4 mr-1" /> Add Term
              </BaseButton>
            </div>
            <div v-if="!store.paymentTerms.length" class="text-dark-500 text-sm text-center py-8">No payment terms configured.</div>
            <div v-else class="divide-y divide-dark-800">
              <div v-for="term in store.paymentTerms" :key="term.id" class="py-3 flex items-center justify-between">
                <div>
                  <span class="text-dark-100 text-sm font-medium">{{ term.name }}</span>
                  <span class="ml-2 px-2 py-0.5 bg-dark-800 rounded text-dark-400 text-xs font-mono">{{ term.days }} days</span>
                  <p v-if="term.description" class="text-dark-500 text-xs mt-0.5">{{ term.description }}</p>
                </div>
                <button @click="handleDeleteTerm(term.id)" class="text-dark-400 hover:text-red-400 transition-colors">
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <!-- Add Term Modal -->
          <BaseModal v-model="showTermModal" title="Add Payment Term" size="sm">
            <div class="space-y-4">
              <BaseInput v-model="termForm.name" label="Name" placeholder="e.g. Net 30" required />
              <BaseInput v-model.number="termForm.days" label="Days" type="number" min="0" required />
              <BaseInput v-model="termForm.description" label="Description" placeholder="Optional" />
            </div>
            <template #footer>
              <BaseButton variant="secondary" @click="showTermModal = false">Cancel</BaseButton>
              <BaseButton variant="primary" @click="handleAddTerm" :disabled="!termForm.name">Add</BaseButton>
            </template>
          </BaseModal>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useDocumentStore } from '../../stores/documents'
import { useToast } from '../../composables/useToast'
import BaseButton from '../../components/base/BaseButton.vue'
import BaseInput from '../../components/base/BaseInput.vue'
import BaseSelect from '../../components/base/BaseSelect.vue'
import BaseModal from '../../components/base/BaseModal.vue'
import { ArrowLeft, Plus, Trash2 } from 'lucide-vue-next'
import type { DocumentType } from '../../types'

const store = useDocumentStore()
const toast = useToast()

const activeType = ref<string>('INVOICE')
const activeTab = ref<'settings' | 'payment-terms'>('settings')
const saving = ref(false)
const showTermModal = ref(false)

const docTypes = [
  { type: 'QUOTATION', label: 'Quotation' },
  { type: 'INVOICE', label: 'Invoice' },
  { type: 'RECEIPT', label: 'Receipt' },
  { type: 'DELIVERY_ORDER', label: 'Delivery Order' },
]

const editForm = reactive({
  prefix: '',
  nextNumber: 1,
  paddingLength: 4,
  includeYear: true,
  yearFormat: 'YY',
  separator: '-',
  template: 'standard',
  templateColor: '#FFD700',
  documentLabel: '',
  footerNotes: '',
  documentSize: 'A4',
  defaultNotes: '',
  defaultTerms: '',
  defaultPaymentTermDays: 30,
})

const termForm = reactive({ name: '', days: 30, description: '' })

const currentSetting = computed(() => store.settings.find((s) => s.documentType === activeType.value))

const numberPreview = computed(() => {
  const year = new Date().getFullYear()
  const yearStr = editForm.yearFormat === 'YY' ? String(year).slice(-2) : String(year)
  const num = String(editForm.nextNumber).padStart(editForm.paddingLength, '0')
  const parts = [editForm.prefix]
  if (editForm.includeYear) parts.push(yearStr)
  return parts.join('') + editForm.separator + num
})

function getPrefix(type: string) {
  return store.settings.find((s) => s.documentType === type)?.prefix || type.substring(0, 3)
}

function selectType(type: string) {
  activeType.value = type
  activeTab.value = 'settings'
  loadSetting()
}

function loadSetting() {
  const s = currentSetting.value
  if (!s) return
  editForm.prefix = s.prefix
  editForm.nextNumber = s.nextNumber
  editForm.paddingLength = s.paddingLength
  editForm.includeYear = s.includeYear
  editForm.yearFormat = s.yearFormat
  editForm.separator = s.separator
  editForm.template = s.template
  editForm.templateColor = s.templateColor
  editForm.documentLabel = s.documentLabel || ''
  editForm.footerNotes = s.footerNotes || ''
  editForm.documentSize = s.documentSize
  editForm.defaultNotes = s.defaultNotes || ''
  editForm.defaultTerms = s.defaultTerms || ''
  editForm.defaultPaymentTermDays = s.defaultPaymentTermDays
}

async function handleSave() {
  saving.value = true
  try {
    await store.updateSettings(activeType.value as DocumentType, editForm)
    toast.success('Settings saved')
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Failed to save')
  } finally {
    saving.value = false
  }
}

async function handleAddTerm() {
  try {
    await store.createPaymentTerm(termForm)
    toast.success('Payment term added')
    showTermModal.value = false
    termForm.name = ''
    termForm.days = 30
    termForm.description = ''
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Failed to add')
  }
}

async function handleDeleteTerm(id: string) {
  if (!confirm('Delete this payment term?')) return
  try {
    await store.deletePaymentTerm(id)
    toast.success('Payment term deleted')
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Failed to delete')
  }
}

watch(() => store.settings, () => loadSetting(), { deep: true })

onMounted(async () => {
  await Promise.all([store.fetchSettings(), store.fetchPaymentTerms()])
  loadSetting()
})
</script>
