<template>
  <div class="min-h-screen bg-dark-950 flex items-center justify-center px-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <img src="/logo.svg" alt="SystemDemo" class="h-24 mx-auto mb-3" />
        <p class="text-dark-400 text-sm">Staff Login</p>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="bg-dark-900 border border-dark-800 rounded-xl p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-dark-200 mb-1.5">Email</label>
          <input
            v-model="email"
            type="email"
            required
            class="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2.5 text-dark-100 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500"
            placeholder="admin@demo.local"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-dark-200 mb-1.5">Password</label>
          <input
            v-model="password"
            type="password"
            required
            class="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2.5 text-dark-100 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500"
            placeholder="Enter your password"
          />
        </div>

        <p v-if="error" class="text-red-400 text-sm">{{ error }}</p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-gold-500 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-gold-600 transition-colors disabled:opacity-50"
        >
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <!-- Demo accounts -->
      <div class="mt-6 bg-gold-50 border border-gold-200 rounded-xl p-4">
        <p class="text-xs font-semibold text-gold-700 uppercase tracking-wider mb-3">Demo Accounts — click to autofill</p>
        <div class="grid grid-cols-1 gap-2">
          <button
            v-for="acc in demoAccounts"
            :key="acc.email"
            type="button"
            @click="fill(acc)"
            class="w-full text-left bg-dark-900 hover:bg-gold-100 border border-dark-700 hover:border-gold-300 rounded-lg px-3 py-2 transition-colors group"
          >
            <div class="flex items-center justify-between">
              <div class="min-w-0">
                <p class="text-sm font-semibold text-dark-100 truncate">{{ acc.label }}</p>
                <p class="text-xs text-dark-400 truncate">{{ acc.email }}</p>
              </div>
              <span class="text-[10px] font-bold tracking-wider text-gold-600 bg-gold-100 px-2 py-0.5 rounded-full shrink-0 ml-3">{{ acc.role }}</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const demoAccounts = [
  { label: 'Demo Admin',     email: 'admin@demo.local',   password: 'admin123',    role: 'ADMIN' },
  { label: 'Lim Boon Keat',  email: 'manager@demo.local', password: 'password123', role: 'MANAGER' },
  { label: 'Ahmad bin Rahman', email: 'ahmad@demo.local', password: 'password123', role: 'WORKER' },
]

function fill(acc: { email: string; password: string }) {
  email.value = acc.email
  password.value = acc.password
  error.value = ''
}

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    router.push('/app/dashboard')
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Invalid credentials'
  } finally {
    loading.value = false
  }
}
</script>
