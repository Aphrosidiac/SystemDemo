<template>
  <div v-if="totalPages > 1" class="flex items-center justify-between mt-4">
    <p class="text-sm text-dark-400">
      Showing {{ (page - 1) * limit + 1 }} to {{ Math.min(page * limit, total) }} of {{ total }}
    </p>
    <div class="flex items-center gap-1">
      <button
        :disabled="page <= 1"
        @click="$emit('update:page', page - 1)"
        class="px-3 py-1.5 text-sm rounded-lg text-dark-300 hover:bg-dark-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        Prev
      </button>
      <button
        v-for="p in visiblePages"
        :key="p"
        @click="$emit('update:page', p)"
        :class="[
          'px-3 py-1.5 text-sm rounded-lg transition-colors',
          p === page ? 'bg-gold-500 text-dark-950 font-medium' : 'text-dark-300 hover:bg-dark-800',
        ]"
      >
        {{ p }}
      </button>
      <button
        :disabled="page >= totalPages"
        @click="$emit('update:page', page + 1)"
        class="px-3 py-1.5 text-sm rounded-lg text-dark-300 hover:bg-dark-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  page: number
  total: number
  limit: number
}>()

defineEmits<{ 'update:page': [page: number] }>()

const totalPages = computed(() => Math.ceil(props.total / props.limit))

const visiblePages = computed(() => {
  const pages: number[] = []
  const start = Math.max(1, props.page - 2)
  const end = Math.min(totalPages.value, start + 4)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})
</script>
