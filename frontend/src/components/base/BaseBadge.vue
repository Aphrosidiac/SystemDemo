<template>
  <span :class="['inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', colorClasses[color || 'gray']]">
    <slot />
  </span>
</template>

<script setup lang="ts">
defineProps<{
  color?: 'gold' | 'green' | 'red' | 'gray' | 'blue'
}>()

const colorClasses: Record<string, string> = {
  gold: 'bg-gold-500/15 text-gold-500',
  green: 'bg-green-500/15 text-green-400',
  red: 'bg-red-500/15 text-red-400',
  gray: 'bg-dark-700 text-dark-300',
  blue: 'bg-blue-500/15 text-blue-400',
}
</script>
