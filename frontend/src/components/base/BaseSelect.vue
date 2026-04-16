<template>
  <div>
    <label v-if="label" :for="id" class="block text-sm font-medium text-dark-200 mb-1.5">
      {{ label }} <span v-if="required" class="text-red-400">*</span>
    </label>
    <select
      :id="id"
      :value="modelValue"
      :required="required"
      :disabled="disabled"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      class="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2.5 text-dark-100 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 disabled:opacity-50"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <slot />
    </select>
    <p v-if="error" class="mt-1 text-xs text-red-400">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue?: string
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
  id?: string
}>()

defineEmits<{ 'update:modelValue': [value: string] }>()
</script>
