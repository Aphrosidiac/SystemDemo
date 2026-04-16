<template>
  <div class="max-w-2xl">
    <div class="flex items-center gap-3 mb-6">
      <button @click="$router.back()" class="text-dark-400 hover:text-dark-200 transition-colors">
        <ArrowLeft class="w-5 h-5" />
      </button>
      <h2 class="text-lg font-semibold text-dark-100">Add New Stock Item</h2>
    </div>

    <form @submit.prevent="handleSubmit" class="bg-dark-900 border border-dark-800 rounded-xl p-6 space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <BaseInput v-model="form.itemCode" label="Item Code" placeholder="e.g. TYR-MIC-001" required />
        <BaseSelect v-model="form.categoryId" label="Category" placeholder="Select category">
          <option v-for="cat in stock.categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
        </BaseSelect>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <BaseSelect v-model="form.brandId" label="Brand" placeholder="Select brand">
          <option v-for="b in filteredBrands" :key="b.id" :value="b.id">{{ b.name }}</option>
        </BaseSelect>
        <BaseSelect v-model="form.countryOfOrigin" label="Country of Origin" placeholder="Select country">
          <option v-for="c in countries" :key="c.code" :value="c.code">{{ c.flag }} {{ c.name }}</option>
        </BaseSelect>
      </div>

      <BaseInput v-model="form.description" label="Description" placeholder="e.g. Michelin Primacy 4 215/55R17" required />

      <div class="grid grid-cols-3 gap-4">
        <BaseSelect v-model="form.uom" label="UOM">
          <option v-for="u in uomOptions" :key="u" :value="u">{{ u }}</option>
        </BaseSelect>
        <BaseInput v-model="form.costPrice" label="Cost Price (RM)" type="number" step="0.01" min="0" required />
        <BaseInput v-model="form.sellPrice" label="Sell Price (RM)" type="number" step="0.01" min="0" required />
      </div>

      <div class="grid grid-cols-3 gap-4">
        <BaseInput v-model="form.quantity" label="Initial Quantity" type="number" min="0" />
        <BaseInput v-model="form.minStock" label="Min Stock Alert" type="number" min="0" placeholder="Default: 5" />
        <BaseInput v-model="form.dotCode" label="DOT Code" placeholder="e.g. 12/06" />
      </div>

      <!-- Tyre options -->
      <div class="flex items-center gap-4 pt-2">
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" v-model="form.isTyre" class="accent-gold-500" />
          <span class="text-dark-300 text-sm">This is a tyre item</span>
        </label>
        <BaseInput v-if="form.isTyre" v-model="form.tyreSize" label="Tyre Size" placeholder="e.g. 185/65R15" class="flex-1 max-w-xs" />
      </div>

      <div class="flex justify-end gap-3 pt-2">
        <BaseButton variant="secondary" type="button" @click="$router.back()">Cancel</BaseButton>
        <BaseButton variant="primary" type="submit" :loading="saving">Save Item</BaseButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStockStore } from '../../stores/stock'
import { useToast } from '../../composables/useToast'
import BaseInput from '../../components/base/BaseInput.vue'
import BaseSelect from '../../components/base/BaseSelect.vue'
import BaseButton from '../../components/base/BaseButton.vue'
import { ArrowLeft } from 'lucide-vue-next'

const router = useRouter()
const stock = useStockStore()
const toast = useToast()
const saving = ref(false)

const uomOptions = ['PCS', 'SET', 'LITRE', 'BOX', 'UNIT', 'PAIR', 'KG']

const countries = [
  { code: 'MY', name: 'Malaysia', flag: '\u{1F1F2}\u{1F1FE}' },
  { code: 'JP', name: 'Japan', flag: '\u{1F1EF}\u{1F1F5}' },
  { code: 'CN', name: 'China', flag: '\u{1F1E8}\u{1F1F3}' },
  { code: 'KR', name: 'South Korea', flag: '\u{1F1F0}\u{1F1F7}' },
  { code: 'TH', name: 'Thailand', flag: '\u{1F1F9}\u{1F1ED}' },
  { code: 'ID', name: 'Indonesia', flag: '\u{1F1EE}\u{1F1E9}' },
  { code: 'DE', name: 'Germany', flag: '\u{1F1E9}\u{1F1EA}' },
  { code: 'US', name: 'United States', flag: '\u{1F1FA}\u{1F1F8}' },
  { code: 'FR', name: 'France', flag: '\u{1F1EB}\u{1F1F7}' },
  { code: 'IT', name: 'Italy', flag: '\u{1F1EE}\u{1F1F9}' },
  { code: 'GB', name: 'United Kingdom', flag: '\u{1F1EC}\u{1F1E7}' },
  { code: 'TW', name: 'Taiwan', flag: '\u{1F1F9}\u{1F1FC}' },
  { code: 'IN', name: 'India', flag: '\u{1F1EE}\u{1F1F3}' },
  { code: 'AU', name: 'Australia', flag: '\u{1F1E6}\u{1F1FA}' },
  { code: 'SG', name: 'Singapore', flag: '\u{1F1F8}\u{1F1EC}' },
]

const form = reactive({
  itemCode: '',
  description: '',
  uom: 'PCS',
  costPrice: '',
  sellPrice: '',
  quantity: '0',
  minStock: '5',
  categoryId: '',
  brandId: '',
  countryOfOrigin: '',
  dotCode: '',
  isTyre: false,
  tyreSize: '',
})

async function handleSubmit() {
  saving.value = true
  try {
    await stock.createItem({
      itemCode: form.itemCode,
      description: form.description,
      uom: form.uom,
      costPrice: parseFloat(form.costPrice),
      sellPrice: parseFloat(form.sellPrice),
      quantity: parseInt(form.quantity),
      minStock: parseInt(form.minStock) || 5,
      categoryId: form.categoryId || undefined,
      brandId: form.brandId || undefined,
      countryOfOrigin: form.countryOfOrigin || undefined,
      dotCode: form.dotCode || undefined,
      isTyre: form.isTyre,
      tyreSize: form.isTyre ? form.tyreSize || undefined : undefined,
    } as any)
    toast.success('Item created successfully')
    router.push('/app/stock')
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Failed to create item')
  } finally {
    saving.value = false
  }
}

const filteredBrands = computed(() =>
  form.categoryId ? stock.brands.filter((b) => b.categoryId === form.categoryId) : []
)

watch(() => form.categoryId, (newVal) => {
  form.brandId = ''
  if (newVal) stock.fetchBrands(newVal)
})

onMounted(() => stock.fetchCategories())
</script>
