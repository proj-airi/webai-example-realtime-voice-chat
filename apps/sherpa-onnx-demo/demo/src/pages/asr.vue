<script setup lang="ts">
import { ref } from 'vue'

import { ASR } from '../libs/asr/asr'
import workletUrl from '../libs/asr/audio_process?url'

interface ASRResult {
  text: string
  finished: boolean
  idx: number
}

const asr = ref<ASR>()
const isInitialized = ref(false)
const isRunning = ref(false)
const isModuleLoading = ref(false)
const error = ref<string | null>(null)
const results = ref<ASRResult[]>([])
const audioContext = ref<AudioContext>()

const baseURL = `ws://172.16.60.12:8001`

// async function initAudioWorklet() {
//   try {
//     audioContext.value = new AudioContext()
//     await audioContext.value.audioWorklet.addModule(workletUrl)
//   }
//   catch (err) {
//     console.error('Error initializing Audio Worklet:', err)
//     error.value = err instanceof Error ? err.message : String(err)
//   }
// }

async function setupASR() {
  try {
    isModuleLoading.value = true
    // await initAudioWorklet()

    const asrInstance = new ASR({
      sampleRate: 16000,
      wsEndpoint: `${baseURL}/asr`,
      workletUrl,
    })

    asrInstance.on('result', (result) => {
      results.value.push(result)
    })

    asrInstance.on('status', ({ type, message }) => {
      if (type === 'error') {
        error.value = message
      }
    })

    asr.value = asrInstance
    isInitialized.value = true
    isModuleLoading.value = false
    startRecording()
  }
  catch (err) {
    console.error('Setup failed:', err)
    error.value = err instanceof Error ? err.message : String(err)
    isModuleLoading.value = false
  }
}

async function destroyASR() {
  await asr.value?.stop()
  await audioContext.value?.close()
  audioContext.value = undefined
  isInitialized.value = false
  isRunning.value = false
  results.value = []
  error.value = null
  isModuleLoading.value = false
}

async function startRecording() {
  try {
    await asr.value?.start()
    isRunning.value = true
    error.value = null
  }
  catch (err) {
    console.error('Failed to start recording:', err)
    error.value = err instanceof Error ? err.message : String(err)
  }
}

function stopRecording() {
  asr.value?.stop()
  isRunning.value = false
}

function toggleRecording() {
  if (isRunning.value) {
    stopRecording()
  }
  else {
    startRecording()
  }
}
</script>

<template>
  <div mb-6 h-full w-full flex flex-col gap-2>
    <div w-full flex-1>
      <div v-if="isModuleLoading" mt-20 flex items-center justify-center text-5xl>
        <div i-svg-spinners:3-dots-move />
      </div>

      <div v-if="error" class="error">
        {{ error }}
      </div>

      <div v-if="results.length > 0" class="results" w-full flex flex-col gap-2>
        <h3>ASR Results ({{ results.length }})</h3>
        <ul>
          <li v-for="(result, index) in results" :key="index" class="result" flex flex-col gap-2>
            <div class="result-text">
              {{ result.text }}
            </div>
          </li>
        </ul>
      </div>
    </div>

    <div w-full flex justify-center gap-4>
      <button aspect-square size-15 flex items-center justify-center rounded-full text-2xl :class="[isRunning ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900' : 'bg-neutral-900 dark:bg-white/20 text-white dark:text-white', isInitialized ? 'opacity-100' : 'opacity-0']" :disabled="!isInitialized" @click="toggleRecording">
        <div i-solar:microphone-3-bold />
      </button>
      <button v-if="!isInitialized" bg="green-500 dark:green-500 hover:green-400 dark:hover:green-400 active:green-500 dark:active:green-500" transition="all duration-250 ease-in-out" aspect-square size-15 flex items-center justify-center rounded-full @click="setupASR">
        <div i-solar:phone-rounded-bold text-4xl text-white />
      </button>
      <button v-else bg="red-500 dark:red-500 hover:red-400 dark:hover:red-400 active:red-500 dark:active:red-500" transition="all duration-250 ease-in-out" aspect-square size-15 flex items-center justify-center rounded-full text-4xl text-white @click="destroyASR">
        <div i-solar:end-call-rounded-bold />
      </button>
    </div>
  </div>
</template>
