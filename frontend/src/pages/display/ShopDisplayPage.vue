<template>
  <div class="h-screen w-screen overflow-hidden flex flex-col font-sans select-none bg-dark-950">
    <!-- Header Bar -->
    <header class="flex items-center justify-between px-4 lg:px-8 py-3 border-b border-dark-700 bg-dark-900 flex-wrap gap-2">
      <div class="flex items-center gap-4">
        <img src="/logo.svg" alt="SystemDemo" class="h-7" />
        <div class="h-5 w-px bg-dark-700"></div>
        <h1 class="text-xs font-medium tracking-[0.3em] uppercase text-dark-400">Workshop Live</h1>
      </div>
      <div class="flex items-center gap-6">
        <div class="flex items-center gap-5 text-xs">
          <span class="text-dark-400">{{ totalJobs }} Jobs</span>
          <span class="text-amber-600 font-medium">{{ waitingCount }} Waiting</span>
          <span class="text-blue-600 font-medium">{{ inProgressCount }} In Progress</span>
          <span class="text-emerald-600 font-medium">{{ readyCount }} Ready</span>
        </div>
        <div class="h-5 w-px bg-dark-700"></div>
        <div class="text-right">
          <p class="text-sm font-semibold tabular-nums text-dark-100">{{ currentTime }}</p>
          <p class="text-[10px] text-dark-400">{{ currentDate }}</p>
        </div>
      </div>
    </header>

    <!-- Columns by Status -->
    <main class="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden">
      <!-- Waiting Column -->
      <section class="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-dark-700 min-w-0">
        <div class="px-4 py-2.5 border-b border-amber-200 bg-amber-50 flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-amber-500"></span>
          <span class="text-amber-700 text-xs font-semibold uppercase tracking-wider">Waiting</span>
          <span class="text-xs ml-auto text-amber-600/60">{{ waitingCount }}</span>
        </div>
        <div class="flex-1 overflow-y-auto p-3 space-y-2 bg-dark-800">
          <div
            v-for="job in waitingJobs"
            :key="job.id"
            class="rounded-lg p-3.5 bg-dark-900 border border-amber-200/60 shadow-sm"
          >
            <div class="flex items-center justify-between mb-1.5">
              <span class="font-bold text-base tracking-wider font-mono text-dark-50">{{ job.plate }}</span>
              <span class="text-xs tabular-nums text-dark-400">{{ formatElapsed(job.elapsed) }}</span>
            </div>
            <p class="text-xs mb-1 text-dark-400">{{ job.vehicle }}</p>
            <p class="text-xs mb-2.5 font-medium text-dark-200">{{ job.customer }}</p>
            <div class="space-y-1 mb-2.5">
              <p v-for="(s, i) in job.services" :key="i" class="text-xs text-dark-300">{{ s }}</p>
            </div>
            <div class="flex items-center gap-1.5 pt-2.5 border-t border-dark-700">
              <div class="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[10px] font-bold">{{ job.foreman.charAt(0) }}</div>
              <span class="text-xs text-dark-400">{{ job.foreman }}</span>
            </div>
          </div>
          <div v-if="!waitingJobs.length" class="text-xs text-center py-8 text-dark-500">No waiting jobs</div>
        </div>
      </section>

      <!-- In Progress Column -->
      <section class="flex-[2] flex flex-col border-b lg:border-b-0 lg:border-r border-dark-700 min-w-0">
        <div class="px-4 py-2.5 border-b border-blue-200 bg-blue-50 flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          <span class="text-blue-700 text-xs font-semibold uppercase tracking-wider">In Progress</span>
          <span class="text-xs ml-auto text-blue-600/60">{{ inProgressCount }}</span>
        </div>
        <div class="flex-1 overflow-y-auto p-3 bg-dark-800">
          <div class="grid grid-cols-1 xl:grid-cols-2 gap-2">
            <div
              v-for="job in progressJobs"
              :key="job.id"
              class="rounded-lg p-3.5 bg-dark-900 border border-blue-200/60 shadow-sm"
            >
              <div class="flex items-center justify-between mb-1.5">
                <span class="font-bold text-base tracking-wider font-mono text-dark-50">{{ job.plate }}</span>
                <span :class="['text-xs tabular-nums', job.elapsed > 120 ? 'text-red-600 font-medium' : 'text-dark-400']">{{ formatElapsed(job.elapsed) }}</span>
              </div>
              <p class="text-xs mb-1 text-dark-400">{{ job.vehicle }}</p>
              <p class="text-xs mb-2.5 font-medium text-dark-200">{{ job.customer }}</p>
              <div class="space-y-1 mb-2.5">
                <p v-for="(s, i) in job.services" :key="i" class="text-xs text-dark-300">{{ s }}</p>
              </div>
              <div class="flex items-center gap-1.5 pt-2.5 border-t border-dark-700">
                <div class="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">{{ job.foreman.charAt(0) }}</div>
                <span class="text-xs text-dark-400">{{ job.foreman }}</span>
              </div>
            </div>
          </div>
          <div v-if="!progressJobs.length" class="text-xs text-center py-8 text-dark-500">No jobs in progress</div>
        </div>
      </section>

      <!-- Ready Column -->
      <section class="flex-1 flex flex-col min-w-0">
        <div class="px-4 py-2.5 border-b border-emerald-200 bg-emerald-50 flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span class="text-emerald-700 text-xs font-semibold uppercase tracking-wider">Ready</span>
          <span class="text-xs ml-auto text-emerald-600/60">{{ readyCount }}</span>
        </div>
        <div class="flex-1 overflow-y-auto p-3 space-y-2 bg-dark-800">
          <div
            v-for="job in readyJobs"
            :key="job.id"
            class="rounded-lg p-3.5 bg-dark-900 border border-emerald-200/60 shadow-sm"
          >
            <div class="flex items-center justify-between mb-1.5">
              <span class="font-bold text-base tracking-wider font-mono text-dark-50">{{ job.plate }}</span>
              <span class="text-xs tabular-nums text-emerald-600/70">{{ formatElapsed(job.elapsed) }}</span>
            </div>
            <p class="text-xs mb-1 text-dark-400">{{ job.vehicle }}</p>
            <p class="text-xs mb-2.5 font-medium text-dark-200">{{ job.customer }}</p>
            <div class="space-y-1 mb-2.5">
              <p v-for="(s, i) in job.services" :key="i" class="text-xs text-dark-300">{{ s }}</p>
            </div>
            <div class="flex items-center gap-1.5 pt-2.5 border-t border-dark-700">
              <div class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">{{ job.foreman.charAt(0) }}</div>
              <span class="text-xs text-dark-400">{{ job.foreman }}</span>
            </div>
          </div>
          <div v-if="!readyJobs.length" class="text-xs text-center py-8 text-dark-500">No ready jobs</div>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="px-8 py-2 border-t border-dark-700 bg-dark-900 flex items-center justify-between">
      <p class="text-[10px] text-dark-400">SystemDemo</p>
      <div class="flex items-center gap-1.5">
        <span class="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <p class="text-[10px] text-dark-400">Live</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import api from '../../lib/api'

// ─── Live Clock ───────────────────────────────────
const currentTime = ref('')
const currentDate = ref('')
let clockTimer: ReturnType<typeof setInterval>

function updateClock() {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
  currentDate.value = now.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

// ─── Live Data ────────────────────────────────────
interface Job {
  id: string
  documentNumber?: string
  plate: string
  vehicle: string
  customer: string
  services: string[]
  foreman: string
  status: 'waiting' | 'progress' | 'ready'
  elapsed: number
}

const jobs = ref<Job[]>([])

const waitingJobs = computed(() => jobs.value.filter(j => j.status === 'waiting'))
const progressJobs = computed(() => jobs.value.filter(j => j.status === 'progress'))
const readyJobs = computed(() => jobs.value.filter(j => j.status === 'ready'))
const waitingCount = computed(() => waitingJobs.value.length)
const inProgressCount = computed(() => progressJobs.value.length)
const readyCount = computed(() => readyJobs.value.length)
const totalJobs = computed(() => jobs.value.length)

function formatElapsed(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

let tickTimer: ReturnType<typeof setInterval>
let pollTimer: ReturnType<typeof setInterval>

async function fetchJobs() {
  try {
    const { data } = await api.get('/shop-display/jobs')
    jobs.value = data.data
  } catch { /* ignore — keep last snapshot */ }
}

onMounted(() => {
  updateClock()
  clockTimer = setInterval(updateClock, 1000)
  tickTimer = setInterval(() => {
    jobs.value.forEach(j => { if (j.status !== 'ready') j.elapsed++ })
  }, 60000)
  fetchJobs()
  pollTimer = setInterval(fetchJobs, 15000)
})

onUnmounted(() => {
  clearInterval(clockTimer)
  clearInterval(tickTimer)
  clearInterval(pollTimer)
})
</script>
