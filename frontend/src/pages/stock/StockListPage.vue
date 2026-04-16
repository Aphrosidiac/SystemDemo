<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-4 flex-1">
        <!-- Search -->
        <div class="relative flex-1 max-w-md">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            v-model="search"
            @input="debouncedFetch"
            type="text"
            placeholder="Search by item code or description..."
            class="w-full bg-dark-800 border border-dark-700 rounded-lg pl-10 pr-3 py-2 text-dark-100 text-sm placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500"
          />
        </div>
        <!-- Category filter -->
        <select
          v-model="categoryFilter"
          @change="handleCategoryChange"
          class="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-dark-100 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50"
        >
          <option value="">All Categories</option>
          <option v-for="cat in stock.categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
        </select>
        <!-- Brand filter (shows when category selected) -->
        <select
          v-if="categoryFilter && filteredBrands.length"
          v-model="brandFilter"
          @change="fetchData"
          class="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-dark-100 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50"
        >
          <option value="">All Brands</option>
          <option v-for="b in filteredBrands" :key="b.id" :value="b.id">{{ b.name }}</option>
        </select>
      </div>
      <div class="flex items-center gap-2 ml-4">
        <BaseButton variant="secondary" size="md" @click="handleExportPdf">
          <FileDown class="w-4 h-4 mr-1.5" /> Export PDF
        </BaseButton>
        <BaseButton variant="secondary" size="md" @click="showCategoryModal = true">
          <Tags class="w-4 h-4 mr-1.5" /> Categories
        </BaseButton>
        <BaseButton variant="secondary" size="md" @click="openBrandModal">
          <Award class="w-4 h-4 mr-1.5" /> Brands
        </BaseButton>
        <BaseButton variant="primary" size="md" @click="$router.push('/app/stock/new')">
          <Plus class="w-4 h-4 mr-1.5" /> Add Item
        </BaseButton>
      </div>
    </div>

    <!-- View Toggle -->
    <div class="flex items-center gap-2 mb-4">
      <button
        @click="viewMode = 'flat'"
        :class="['px-3 py-1.5 text-xs font-medium rounded-lg transition-colors', viewMode === 'flat' ? 'bg-gold-500/10 text-gold-500 border border-gold-500/30' : 'text-dark-400 border border-dark-700 hover:text-dark-200']"
      >
        List View
      </button>
      <button
        @click="switchToGrouped"
        :class="['px-3 py-1.5 text-xs font-medium rounded-lg transition-colors', viewMode === 'grouped' ? 'bg-gold-500/10 text-gold-500 border border-gold-500/30' : 'text-dark-400 border border-dark-700 hover:text-dark-200']"
      >
        Group by Category
      </button>
    </div>

    <!-- Flat Table View -->
    <template v-if="viewMode === 'flat'">
      <BaseTable :columns="columns" :data="stock.items" :loading="stock.loading" empty-text="No stock items found.">
        <template #cell-itemCode="{ value }">
          <span class="font-mono text-gold-500">{{ value }}</span>
        </template>
        <template #cell-category="{ row }">
          <div class="flex flex-col gap-0.5">
            <BaseBadge v-if="row.category" color="gray">{{ row.category.name }}</BaseBadge>
            <span v-else class="text-dark-500">—</span>
            <span v-if="row.brand" class="text-dark-400 text-xs">{{ row.brand.name }}</span>
          </div>
        </template>
        <template #cell-countryOfOrigin="{ value }">
          <span v-if="value" :title="value">{{ countryFlag(value) }}</span>
          <span v-else class="text-dark-600">—</span>
        </template>
        <template #cell-costPrice="{ value }">
          RM {{ Number(value).toFixed(2) }}
        </template>
        <template #cell-sellPrice="{ value }">
          RM {{ Number(value).toFixed(2) }}
        </template>
        <template #cell-quantity="{ value, row }">
          <div>
            <span :class="value <= (row.minStock ?? 5) ? 'text-red-400 font-semibold' : ''">{{ value }}</span>
            <span v-if="row.holdQuantity > 0" class="text-yellow-500 text-xs ml-1" title="On Hold">({{ row.holdQuantity }} held)</span>
          </div>
        </template>
        <template #actions="{ row }">
          <div class="flex items-center gap-1 justify-end">
            <button @click="$router.push(`/app/stock/${row.id}/history`)" class="p-1.5 text-dark-400 hover:text-blue-400 transition-colors" title="History">
              <History class="w-4 h-4" />
            </button>
            <button @click="$router.push(`/app/stock/${row.id}/edit`)" class="p-1.5 text-dark-400 hover:text-gold-500 transition-colors" title="Edit">
              <Pencil class="w-4 h-4" />
            </button>
            <button @click="confirmDelete(row as any)" class="p-1.5 text-dark-400 hover:text-red-400 transition-colors" title="Delete">
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </template>
      </BaseTable>

      <!-- Pagination -->
      <BasePagination
        :page="stock.page"
        :total="stock.total"
        :limit="stock.limit"
        @update:page="(p) => { stock.page = p; fetchData() }"
      />
    </template>

    <!-- Grouped View -->
    <template v-else>
      <div v-if="groupedLoading" class="text-dark-400 text-center py-12">Loading all items...</div>
      <div v-else-if="!groupedItems.length" class="text-dark-400 text-center py-12">No stock items found.</div>
      <div v-else class="space-y-6">
        <div v-for="group in groupedItems" :key="group.category" class="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden">
          <!-- Category Header -->
          <button
            @click="group.expanded = !group.expanded"
            class="w-full flex items-center justify-between px-5 py-3 hover:bg-dark-800/50 transition-colors"
          >
            <div class="flex items-center gap-3">
              <ChevronRight :class="['w-4 h-4 text-dark-400 transition-transform', group.expanded && 'rotate-90']" />
              <h3 class="text-dark-100 font-semibold text-sm">{{ group.category }}</h3>
              <BaseBadge color="gray">{{ group.totalItems }} items</BaseBadge>
              <span v-if="group.brands.length > 1" class="text-dark-500 text-xs">{{ group.brands.length }} brands</span>
            </div>
            <span class="text-dark-400 text-xs">Total Qty: {{ group.totalQty }}</span>
          </button>
          <!-- Brands & Items -->
          <div v-if="group.expanded" class="border-t border-dark-800">
            <div v-for="brandGroup in group.brands" :key="brandGroup.brand">
              <!-- Brand sub-header -->
              <div v-if="group.brands.length > 1" class="px-5 py-1.5 bg-dark-800/40 border-b border-dark-800/50 flex items-center gap-2">
                <span class="text-gold-500/70 text-xs font-medium">{{ brandGroup.brand }}</span>
                <span class="text-dark-500 text-xs">({{ brandGroup.items.length }})</span>
              </div>
              <table class="w-full text-sm">
                <tbody>
                  <tr v-for="item in brandGroup.items" :key="item.id" class="border-b border-dark-800/50 hover:bg-dark-800/30">
                    <td class="px-5 py-2" style="width: 120px;"><span class="font-mono text-gold-500 text-xs">{{ item.itemCode }}</span></td>
                    <td class="px-3 py-2 text-dark-200">{{ item.description }}</td>
                    <td class="px-3 py-2 text-dark-400" style="width: 60px;">{{ item.uom }}</td>
                    <td class="px-3 py-2 text-right text-dark-300" style="width: 100px;">RM {{ Number(item.costPrice).toFixed(2) }}</td>
                    <td class="px-3 py-2 text-right text-dark-300" style="width: 100px;">RM {{ Number(item.sellPrice).toFixed(2) }}</td>
                    <td class="px-3 py-2 text-right" style="width: 80px;">
                      <span :class="item.quantity <= (item.minStock ?? 5) ? 'text-red-400 font-semibold' : 'text-dark-200'">{{ item.quantity }}</span>
                      <span v-if="item.holdQuantity > 0" class="text-yellow-500 text-xs ml-1">({{ item.holdQuantity }} held)</span>
                    </td>
                    <td class="px-5 py-2" style="width: 100px;">
                      <div class="flex items-center gap-1 justify-end">
                        <button @click="$router.push(`/app/stock/${item.id}/history`)" class="p-1 text-dark-400 hover:text-blue-400 transition-colors"><History class="w-3.5 h-3.5" /></button>
                        <button @click="$router.push(`/app/stock/${item.id}/edit`)" class="p-1 text-dark-400 hover:text-gold-500 transition-colors"><Pencil class="w-3.5 h-3.5" /></button>
                        <button @click="confirmDelete(item)" class="p-1 text-dark-400 hover:text-red-400 transition-colors"><Trash2 class="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Category Modal -->
    <BaseModal v-model="showCategoryModal" title="Manage Categories" size="md">
      <div class="space-y-3">
        <!-- Add category form -->
        <form @submit.prevent="handleAddCategory" class="flex gap-2">
          <input
            v-model="newCategoryName"
            placeholder="Category name"
            class="flex-1 bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-dark-100 text-sm placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
          />
          <input
            v-model="newCategoryCode"
            placeholder="Code"
            class="w-20 bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-dark-100 text-sm placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
          />
          <BaseButton variant="primary" size="md" type="submit" :disabled="!newCategoryName">Add</BaseButton>
        </form>
        <!-- List -->
        <div class="divide-y divide-dark-800 max-h-64 overflow-y-auto">
          <div v-for="cat in stock.categories" :key="cat.id" class="flex items-center justify-between py-2">
            <div>
              <span class="text-dark-100 text-sm">{{ cat.name }}</span>
              <span v-if="cat.code" class="text-dark-500 text-xs ml-2">({{ cat.code }})</span>
              <span v-if="cat._count" class="text-dark-500 text-xs ml-2">{{ cat._count.items }} items</span>
            </div>
            <button @click="handleDeleteCategory(cat.id)" class="text-dark-400 hover:text-red-400 transition-colors">
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
          <p v-if="!stock.categories.length" class="py-4 text-center text-dark-400 text-sm">No categories yet.</p>
        </div>
      </div>
    </BaseModal>

    <!-- Delete Confirmation Modal -->
    <BaseModal v-model="showDeleteModal" title="Delete Item" size="sm">
      <p class="text-dark-300 text-sm">
        Are you sure you want to delete <strong class="text-dark-100">{{ itemToDelete?.itemCode }}</strong>?
      </p>
      <template #footer>
        <BaseButton variant="secondary" @click="showDeleteModal = false">Cancel</BaseButton>
        <BaseButton variant="danger" @click="handleDelete" :loading="deleting">Delete</BaseButton>
      </template>
    </BaseModal>

    <!-- Brand Modal -->
    <BaseModal v-model="showBrandModal" title="Manage Brands" size="md">
      <div class="space-y-4">
        <!-- Category selector -->
        <div>
          <label class="block text-sm text-dark-300 mb-1">Category</label>
          <select
            v-model="brandModalCategoryId"
            @change="loadBrandsForCategory"
            class="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-dark-100 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50"
          >
            <option value="">Select a category</option>
            <option v-for="cat in stock.categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>

        <!-- Add brand form -->
        <form v-if="brandModalCategoryId" @submit.prevent="handleAddBrand" class="flex gap-2">
          <input
            v-model="newBrandName"
            placeholder="Brand name"
            class="flex-1 bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-dark-100 text-sm placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
          />
          <input
            v-model="newBrandCode"
            placeholder="Code"
            class="w-20 bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-dark-100 text-sm placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
          />
          <BaseButton variant="primary" size="md" type="submit" :disabled="!newBrandName">Add</BaseButton>
        </form>

        <!-- Brand list -->
        <div v-if="brandModalCategoryId" class="divide-y divide-dark-800 max-h-64 overflow-y-auto">
          <div v-for="b in modalBrands" :key="b.id" class="flex items-center justify-between py-2">
            <div>
              <span class="text-dark-100 text-sm">{{ b.name }}</span>
              <span v-if="b.code" class="text-dark-500 text-xs ml-2">({{ b.code }})</span>
              <span v-if="b._count" class="text-dark-500 text-xs ml-2">{{ b._count.items }} items</span>
            </div>
            <button @click="handleDeleteBrand(b.id)" class="text-dark-400 hover:text-red-400 transition-colors">
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
          <p v-if="!modalBrands.length" class="py-4 text-center text-dark-400 text-sm">No brands for this category yet.</p>
        </div>

        <p v-else class="py-4 text-center text-dark-500 text-sm">Select a category first to manage its brands.</p>
      </div>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useStockStore } from '../../stores/stock'
import { useToast } from '../../composables/useToast'
import BaseButton from '../../components/base/BaseButton.vue'
import BaseTable from '../../components/base/BaseTable.vue'
import BasePagination from '../../components/base/BasePagination.vue'
import BaseBadge from '../../components/base/BaseBadge.vue'
import BaseModal from '../../components/base/BaseModal.vue'
import { Search, Plus, Pencil, Trash2, Tags, History, FileDown, Award, ChevronRight } from 'lucide-vue-next'
import { exportStockListPdf } from '../../lib/pdf-export'
import type { StockItem } from '../../types'

const stock = useStockStore()
const toast = useToast()

const viewMode = ref<'flat' | 'grouped'>('flat')
const groupedLoading = ref(false)
interface BrandGroup { brand: string; items: StockItem[] }
interface CategoryGroup { category: string; brands: BrandGroup[]; totalQty: number; totalItems: number; expanded: boolean }
const groupedItems = ref<CategoryGroup[]>([])

const search = ref('')
const categoryFilter = ref('')
const showCategoryModal = ref(false)
const showDeleteModal = ref(false)
const itemToDelete = ref<StockItem | null>(null)
const deleting = ref(false)
const newCategoryName = ref('')
const newCategoryCode = ref('')

// Brand modal state
const showBrandModal = ref(false)
const brandModalCategoryId = ref('')
const newBrandName = ref('')
const newBrandCode = ref('')
const modalBrands = ref<any[]>([])

const brandFilter = ref('')

const filteredBrands = computed(() =>
  categoryFilter.value ? stock.brands.filter((b) => b.categoryId === categoryFilter.value) : []
)

const columns = [
  { key: 'itemCode', label: 'Item Code' },
  { key: 'description', label: 'Description' },
  { key: 'category', label: 'Category / Brand' },
  { key: 'countryOfOrigin', label: 'Origin' },
  { key: 'uom', label: 'UOM' },
  { key: 'costPrice', label: 'Cost (RM)' },
  { key: 'sellPrice', label: 'Price (RM)' },
  { key: 'quantity', label: 'Qty' },
]

const COUNTRY_FLAGS: Record<string, string> = {
  MY: '\u{1F1F2}\u{1F1FE}', JP: '\u{1F1EF}\u{1F1F5}', CN: '\u{1F1E8}\u{1F1F3}', KR: '\u{1F1F0}\u{1F1F7}',
  TH: '\u{1F1F9}\u{1F1ED}', ID: '\u{1F1EE}\u{1F1E9}', DE: '\u{1F1E9}\u{1F1EA}', US: '\u{1F1FA}\u{1F1F8}',
  FR: '\u{1F1EB}\u{1F1F7}', IT: '\u{1F1EE}\u{1F1F9}', GB: '\u{1F1EC}\u{1F1E7}', AU: '\u{1F1E6}\u{1F1FA}',
  IN: '\u{1F1EE}\u{1F1F3}', TW: '\u{1F1F9}\u{1F1FC}', SG: '\u{1F1F8}\u{1F1EC}',
}
function countryFlag(code: string): string {
  return COUNTRY_FLAGS[code.toUpperCase()] || code
}

let debounceTimer: ReturnType<typeof setTimeout>
function debouncedFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { stock.page = 1; fetchData() }, 300)
}

function handleCategoryChange() {
  brandFilter.value = ''
  if (categoryFilter.value) stock.fetchBrands(categoryFilter.value)
  fetchData()
}

function fetchData() {
  stock.fetchItems({
    search: search.value || undefined,
    categoryId: categoryFilter.value || undefined,
    brandId: brandFilter.value || undefined,
  })
}

function confirmDelete(item: StockItem) {
  itemToDelete.value = item
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!itemToDelete.value) return
  deleting.value = true
  try {
    await stock.deleteItem(itemToDelete.value.id)
    toast.success('Item deleted')
    showDeleteModal.value = false
    fetchData()
  } catch {
    toast.error('Failed to delete item')
  } finally {
    deleting.value = false
  }
}

async function handleAddCategory() {
  if (!newCategoryName.value) return
  try {
    await stock.createCategory({ name: newCategoryName.value, code: newCategoryCode.value || undefined })
    toast.success('Category added')
    newCategoryName.value = ''
    newCategoryCode.value = ''
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Failed to add category')
  }
}

async function handleDeleteCategory(id: string) {
  try {
    await stock.deleteCategory(id)
    toast.success('Category deleted')
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Failed to delete category')
  }
}

// Brand modal functions
function openBrandModal() {
  brandModalCategoryId.value = ''
  modalBrands.value = []
  newBrandName.value = ''
  newBrandCode.value = ''
  showBrandModal.value = true
}

async function loadBrandsForCategory() {
  if (!brandModalCategoryId.value) {
    modalBrands.value = []
    return
  }
  await stock.fetchBrands(brandModalCategoryId.value)
  modalBrands.value = stock.brands.filter((b) => b.categoryId === brandModalCategoryId.value)
}

async function handleAddBrand() {
  if (!newBrandName.value || !brandModalCategoryId.value) return
  try {
    await stock.createBrand({ categoryId: brandModalCategoryId.value, name: newBrandName.value, code: newBrandCode.value || undefined })
    toast.success('Brand added')
    newBrandName.value = ''
    newBrandCode.value = ''
    await loadBrandsForCategory()
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Failed to add brand')
  }
}

async function handleDeleteBrand(id: string) {
  try {
    await stock.deleteBrand(id)
    toast.success('Brand deleted')
    await loadBrandsForCategory()
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Failed to delete brand')
  }
}

async function switchToGrouped() {
  viewMode.value = 'grouped'
  groupedLoading.value = true
  try {
    const { data } = await import('../../lib/api').then(m => m.default.get('/stock', {
      params: { limit: 9999, search: search.value || undefined, categoryId: categoryFilter.value || undefined, brandId: brandFilter.value || undefined },
    }))
    const allItems = data.data as StockItem[]
    const catMap = new Map<string, Map<string, StockItem[]>>()
    for (const item of allItems) {
      const cat = (item as any).category?.name || 'Uncategorized'
      const brand = (item as any).brand?.name || 'No Brand'
      if (!catMap.has(cat)) catMap.set(cat, new Map())
      const brandMap = catMap.get(cat)!
      if (!brandMap.has(brand)) brandMap.set(brand, [])
      brandMap.get(brand)!.push(item)
    }
    groupedItems.value = Array.from(catMap.entries()).map(([category, brandMap]) => {
      const brands = Array.from(brandMap.entries()).map(([brand, items]) => ({ brand, items }))
      const allCatItems = brands.flatMap(b => b.items)
      return {
        category,
        brands,
        totalQty: allCatItems.reduce((s, i) => s + i.quantity, 0),
        totalItems: allCatItems.length,
        expanded: true,
      }
    })
  } catch { /* ignore */ } finally {
    groupedLoading.value = false
  }
}

function handleExportPdf() {
  if (stock.items.length) {
    exportStockListPdf(stock.items)
    toast.success('PDF exported')
  }
}

onMounted(() => {
  fetchData()
  stock.fetchCategories()
})

onUnmounted(() => clearTimeout(debounceTimer))
</script>
