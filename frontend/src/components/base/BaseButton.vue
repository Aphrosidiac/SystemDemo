<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[baseClasses, variantClasses[variant || 'primary'], sizeClasses[size || 'md'], disabled && 'opacity-50 cursor-not-allowed']"
  >
    <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit'
  loading?: boolean
  disabled?: boolean
}>()

const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-950'

const variantClasses: Record<string, string> = {
  primary: 'bg-gold-500 text-dark-950 hover:bg-gold-400 focus:ring-gold-500',
  secondary: 'bg-dark-800 text-dark-100 border border-dark-700 hover:bg-dark-700 focus:ring-dark-500',
  danger: 'bg-red-600 text-white hover:bg-red-500 focus:ring-red-500',
  ghost: 'text-dark-300 hover:text-dark-100 hover:bg-dark-800 focus:ring-dark-500',
}

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-sm',
}
</script>
