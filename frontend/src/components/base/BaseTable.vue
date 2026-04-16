<template>
  <div class="overflow-x-auto bg-dark-900 border border-dark-800 rounded-xl">
    <table class="w-full text-sm text-left">
      <thead class="text-xs text-dark-400 uppercase bg-dark-800/50 border-b border-dark-800">
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            class="px-4 py-3 font-medium whitespace-nowrap"
            :class="col.class"
          >
            {{ col.label }}
          </th>
          <th v-if="$slots.actions" class="px-4 py-3 font-medium text-right">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-dark-800">
        <tr v-if="loading">
          <td :colspan="columns.length + ($slots.actions ? 1 : 0)" class="px-4 py-12 text-center text-dark-400">
            Loading...
          </td>
        </tr>
        <tr v-else-if="!data.length">
          <td :colspan="columns.length + ($slots.actions ? 1 : 0)" class="px-4 py-12 text-center text-dark-400">
            {{ emptyText }}
          </td>
        </tr>
        <tr v-else v-for="(row, index) in data" :key="index" class="hover:bg-dark-800/30 transition-colors">
          <td v-for="col in columns" :key="col.key" class="px-4 py-3 text-dark-200 whitespace-nowrap" :class="col.class">
            <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
              {{ row[col.key] }}
            </slot>
          </td>
          <td v-if="$slots.actions" class="px-4 py-3 text-right">
            <slot name="actions" :row="row" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  columns: { key: string; label: string; class?: string }[]
  data: Record<string, any>[]
  loading?: boolean
  emptyText?: string
}>()
</script>
