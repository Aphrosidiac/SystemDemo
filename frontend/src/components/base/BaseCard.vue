<template>
  <div class="bg-dark-900 border border-dark-800 rounded-xl p-6">
    <div v-if="title" class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-semibold text-dark-200 uppercase tracking-wider">{{ title }}</h3>
      <slot name="header-action" />
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{ title?: string }>()
</script>
