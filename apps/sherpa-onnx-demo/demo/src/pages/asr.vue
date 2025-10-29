<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core'
import { ref } from 'vue'

import FieldInput from '../components/FieldInput.vue'
import Section from '../components/Section.vue'
import { ASR } from '../libs/asr/asr'
import workletUrl from '../libs/asr/audio_process?worker&url'

interface AudioSegment {
  buffer: Float32Array
  duration: number
  timestamp: number
  audioSrc: string
  transcription: string
}

const asr = ref<ASR>()
const isInitialized = ref(false)
const isRunning = ref(false)
const isModuleLoading = ref(false)
const error = ref<string | null>(null)
const segments = ref<AudioSegment[]>([])
const audioContext = ref<AudioContext>()

const asrProviderBaseURL = useLocalStorage('wsASRProviderBaseURL', 'ws://localhost:8000')

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
      wsEndpoint: `${asrProviderBaseURL.value}/asr`,
      workletUrl,
    })

    asrInstance.on('result', (result) => {
      segments.value.push({
        audioSrc: '',
        buffer: new Float32Array(),
        duration: 0,
        timestamp: 0,
        transcription: result.text,
      })
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
  segments.value = []
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
  <div mb-6 mt-4 h-full w-full flex flex-col gap-2>
    <div w-full flex flex-1 flex-col gap-2>
      <Section title="Settings" icon="i-solar:settings-bold" :expand="!isInitialized">
        <div flex="~ col gap-4">
          <FieldInput
            v-model="asrProviderBaseURL" label="ASR Provider Base URL"
            description="The base URL of the ASR provider. Generally, Speaches is recommended."
          />
        </div>
      </Section>

      <Section title="Transcriptions" icon="i-solar:microphone-3-bold" :expand="true">
        <ul v-if="segments?.length && segments.length > 0">
          <li v-for="(segment, index) in segments" :key="index" class="segment" flex flex-col gap-2>
            <div class="segment-info" grid="~ cols-[120px_1fr] gap-2">
              <span text="neutral-400 dark:neutral-500">Duration</span>
              <span font-mono>
                {{ segment.duration.toFixed(2) }}s
              </span>
              <span text="neutral-400 dark:neutral-500">Transcription</span>
              <span>
                {{ segment.transcription }}
              </span>
            </div>
          </li>
        </ul>
      </Section>

      <div v-if="isModuleLoading" mt-20 flex items-center justify-center text-5xl>
        <div i-svg-spinners:3-dots-move />
      </div>

      <div v-if="error" class="error">
        {{ error }}
      </div>
    </div>

    <div w-full flex justify-center gap-4>
      <button
        aspect-square size-15 flex items-center justify-center rounded-full text-2xl
        :class="[isRunning ? 'bg-neutral-700 dark:bg-white text-white dark:text-neutral-900' : 'bg-neutral-900 dark:bg-white/20 text-white dark:text-white', isInitialized ? 'opacity-100' : 'opacity-0']"
        :disabled="!isInitialized" @click="toggleRecording"
      >
        <div i-solar:microphone-3-bold />
      </button>
      <button
        v-if="!isInitialized"
        bg="green-500 dark:green-500 hover:green-400 dark:hover:green-400 active:green-500 dark:active:green-500"
        transition="all duration-250 ease-in-out" aspect-square size-15 flex items-center justify-center rounded-full
        @click="setupASR"
      >
        <div i-solar:phone-rounded-bold text-4xl text-white />
      </button>
      <button
        v-else bg="red-500 dark:red-500 hover:red-400 dark:hover:red-400 active:red-500 dark:active:red-500"
        transition="all duration-250 ease-in-out" aspect-square size-15 flex items-center justify-center rounded-full
        text-4xl text-white @click="destroyASR"
      >
        <div i-solar:end-call-rounded-bold />
      </button>
    </div>
  </div>
</template>
