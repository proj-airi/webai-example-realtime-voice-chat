<script setup lang="ts">
import type { Message } from '@xsai/shared-chat'

import { createWorkflow, getContext, workflowEvent } from '@llama-flow/core'
import { useLocalStorage, useElementBounding, useScroll } from '@vueuse/core'
import { generateTranscription } from '@xsai/generate-transcription'
import { streamText } from '@xsai/stream-text'
import { ref, toRaw, onUnmounted, nextTick } from 'vue'
import { generateSpeech } from '@xsai/generate-speech'

import FieldInput from '../components/FieldInput.vue'
import Section from '../components/Section.vue'
import { VADAudioManager } from '../libs/vad/manager'
import workletUrl from '../libs/vad/process.worklet?worker&url'
import { createVAD } from '../libs/vad/vad'
import { toWav } from '../libs/vad/wav'
import { useAudioContext } from '../composables/audio-context'

interface AudioSegment {
  buffer: Float32Array
  duration: number
  timestamp: number
  audioSrc: string
  transcription: string
}

const llmInputSpeechEvent = workflowEvent<{ buffer: Float32Array<ArrayBufferLike>, duration: number }, 'input-speech'>()
const llmTranscriptionEvent = workflowEvent<string, 'transcription'>()
const llmChatCompletionsTokenEvent = workflowEvent<string, 'chat-completions-token'>()
const llmChatCompletionsEndedEvent = workflowEvent<string, 'chat-completions-ended'>()
const llmSentenceReadyEvent = workflowEvent<{ text: string, index: number }, 'sentence-ready'>()
const llmTTSOutputEvent = workflowEvent<{ buffer: AudioBuffer, index: number }, 'tts-output'>()

const llmProviderBaseURL = useLocalStorage('llmProviderBaseURL', 'https://openrouter.ai/api/v1/')
const llmProviderAPIKey = useLocalStorage('llmProviderAPIKey', '')
const llmProviderModel = useLocalStorage('llmProviderModel', 'gpt-4o-mini')

const asrProviderBaseURL = useLocalStorage('asrProviderBaseURL', 'http://localhost:8000/v1/')
const asrProviderAPIKey = useLocalStorage('asrProviderAPIKey', '')
const asrProviderModel = useLocalStorage('asrProviderModel', 'large-v3-turbo')

const ttsProviderBaseURL = useLocalStorage('ttsProviderBaseURL', 'http://unspeech.ayaka.io/v1/')
const ttsProviderAPIKey = useLocalStorage('ttsProviderAPIKey', '')
const ttsProviderModel = useLocalStorage('ttsProviderModel', '')
const ttsProviderVoice = useLocalStorage('ttsProviderVoice', '')

const audioManager = ref<VADAudioManager>()
const isInitialized = ref(false)
const isRunning = ref(false)
const isSpeechDetected = ref(false)
const segments = ref<AudioSegment[]>([])
const error = ref<string | null>(null)
const isModuleLoading = ref(false)
const messagesContainerRef = ref<HTMLElement>()

const sending = ref(false)
const messages = ref<Message[]>([
  {
    role: 'system',
    content: '' +
      'You are having a phone call with a user, the texts are all transcribed from '+
      'the audio, it may not be accurate, if you cannot understand what user said, '+
      'please ask them to repeat it.' +
      'When responding, for every sentence, please put a <break/> marker for me to '+
      'parse for you.',
  },
])
const streamingMessage = ref<Message>({ role: 'assistant', content: '' })
const ttsSentenceBuffer = ref('')
const audioPlaybackQueue = ref<AudioBuffer[]>([])
const pendingAudioBuffers = ref<Map<number, AudioBuffer>>(new Map())
const nextExpectedAudioIndex = ref(0)
const sentenceCounter = ref(0)
const isPlayingAudio = ref(false)

const llmWorkflow = createWorkflow()
const llmWorkflowContext = llmWorkflow.createContext()

const bounding = useElementBounding(messagesContainerRef.value, { immediate: true, windowScroll: true, windowResize: true })
const { y: messagesContainerY } = useScroll(messagesContainerRef.value)
const { audioContext, ensure, dispose } = useAudioContext()

async function* asyncIteratorFromReadableStream<T, F = Uint8Array>(res: ReadableStream<F>, func: (value: F) => Promise<T>): AsyncGenerator<T, void, unknown> {
  // react js - TS2504: Type 'ReadableStream<Uint8Array>' must have a '[Symbol.asyncIterator]()' method that returns an async iterator - Stack Overflow
  // https://stackoverflow.com/questions/76700924/ts2504-type-readablestreamuint8array-must-have-a-symbol-asynciterator
  const reader = res.getReader()
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        return
      }

      yield func(value)
    }
  }
  finally {
    reader.releaseLock()
  }
}

llmWorkflow.handle([llmInputSpeechEvent], async (event) => {
  const context = getContext()

  const wavBuffer = toWav(event.data.buffer, 16000)
  const audioBlob = new Blob([wavBuffer], { type: 'audio/wav' })

  const obj = {
    buffer: event.data.buffer,
    duration: event.data.duration / 1000, // Convert to seconds for display
    timestamp: Date.now(),
    audioSrc: URL.createObjectURL(audioBlob),
    transcription: '',
  }

  // Store the segment
  const objIndex = segments.value.push(obj)

  generateTranscription({
    baseURL: asrProviderBaseURL.value,
    file: audioBlob,
    model: asrProviderModel.value,
    apiKey: asrProviderAPIKey.value,
  }).then((res) => {
    segments.value[objIndex - 1].transcription = res.text
    nextTick(() => {
      bounding.update()
      messagesContainerY.value = bounding.height.value
    })
    context.sendEvent(llmTranscriptionEvent.with(res.text))
  }).catch((err) => {
    console.error('Failed to generate transcription:', err)
  })
})

llmWorkflow.handle([llmTranscriptionEvent], async (event) => {
  const context = getContext()

  try {
    sending.value = true

    if (!event.data)
      return

    streamingMessage.value = { role: 'assistant', content: '' }
    messages.value.push({ role: 'user', content: event.data })
    messages.value.push(streamingMessage.value)
    const newMessages = messages.value.slice(0, messages.value.length - 1).map(msg => toRaw(msg))

    const res = await streamText({
      baseURL: llmProviderBaseURL.value,
      apiKey: llmProviderAPIKey.value,
      model: llmProviderModel.value,
      messages: newMessages as Message[],
    })

    let fullText = ''

    for await (const textPart of asyncIteratorFromReadableStream(res.textStream, async v => v)) {
      fullText += textPart
      context.sendEvent(llmChatCompletionsTokenEvent.with(textPart))
    }

    nextTick(() => {
      bounding.update()
      messagesContainerY.value = bounding.height.value
    })

    context.sendEvent(llmChatCompletionsEndedEvent.with(fullText))
  }
  catch (error) {
    console.error('Error sending message:', error)
    throw error
  }
  finally {
    sending.value = false
  }
})

llmWorkflow.handle([llmChatCompletionsTokenEvent], async (event) => {
  const context = getContext()
  const breakMarker = '<break/>'
  const token = event.data as string

  if (!streamingMessage.value.content) {
    streamingMessage.value.content = ''
  }
  ttsSentenceBuffer.value += token

  while (true) {
    const markerIndex = ttsSentenceBuffer.value.indexOf(breakMarker)
    if (markerIndex === -1) {
      break
    }

    const sentenceText = ttsSentenceBuffer.value.substring(0, markerIndex).trim()
    if (sentenceText) {
      streamingMessage.value.content += sentenceText + ' '
    }

    ttsSentenceBuffer.value = ttsSentenceBuffer.value.substring(markerIndex + breakMarker.length)

    if (sentenceText) {
      context.sendEvent(llmSentenceReadyEvent.with({ text: sentenceText, index: sentenceCounter.value }))
      sentenceCounter.value++
    }
  }
})

llmWorkflow.handle([llmChatCompletionsEndedEvent], async (event) => {
  const context = getContext()
  const remainingText = ttsSentenceBuffer.value.trim()

  if (remainingText) {
    streamingMessage.value.content += remainingText + ' '
  }

  if (remainingText) {
    context.sendEvent(llmSentenceReadyEvent.with({ text: remainingText, index: sentenceCounter.value }))
    sentenceCounter.value++
  }
  ttsSentenceBuffer.value = ''
})

llmWorkflow.handle([llmSentenceReadyEvent], async (event) => {
  const context = getContext()
  const { text, index } = event.data
  try {
    const res = await generateSpeech({
      baseURL: ttsProviderBaseURL.value,
      apiKey: ttsProviderAPIKey.value,
      model: ttsProviderModel.value,
      voice: ttsProviderVoice.value,
      input: text,
    })

    const audioBuffer = await audioContext.value!.decodeAudioData(res)
    context.sendEvent(llmTTSOutputEvent.with({ buffer: audioBuffer, index }))
  }
  catch (err) {
    console.error('Failed to generate or decode speech:', err)
    // Optionally handle TTS errors, e.g., display a message
  }
})

llmWorkflow.handle([llmTTSOutputEvent], (event): Promise<void> => {
  const { buffer, index } = event.data

  // Store the received buffer
  pendingAudioBuffers.value.set(index, buffer)

  // Check if we can enqueue buffers in order
  while (pendingAudioBuffers.value.has(nextExpectedAudioIndex.value)) {
    const bufferToPlay = pendingAudioBuffers.value.get(nextExpectedAudioIndex.value)!
    pendingAudioBuffers.value.delete(nextExpectedAudioIndex.value)
    audioPlaybackQueue.value.push(bufferToPlay)
    nextExpectedAudioIndex.value++
  }

  // Start playback if not already playing and queue has items
  playNextAudio() // Checks internally if already playing
  return Promise.resolve() // Handler completes immediately after queuing logic
})

async function setupSpeechDetection() {
  messages.value = [
    messages.value[0],
  ]

  try {
    isModuleLoading.value = true

    // Create and initialize the VAD
    const vad = await createVAD({
      sampleRate: 16000,
      speechThreshold: 0.3,
      exitThreshold: 0.1,
      minSilenceDurationMs: 400,
    })

    // Set up event handlers
    vad.on('speech-start', () => {
      isSpeechDetected.value = true
    })

    vad.on('speech-end', () => {
      isSpeechDetected.value = false
    })

    vad.on('speech-ready', async ({ buffer, duration }) => {
      llmWorkflowContext.sendEvent(llmInputSpeechEvent.with({ buffer, duration }))
    })

    vad.on('status', ({ type, message }) => {
      if (type === 'error') {
        error.value = message
      }
    })

    // Create and initialize audio manager
    const m = new VADAudioManager(vad, {
      minChunkSize: 512,
      audioContextOptions: {
        sampleRate: 16000,
        latencyHint: 'interactive',
      },
    })

    await m.initialize(workletUrl)
    audioManager.value = m
    isInitialized.value = true
    isModuleLoading.value = false
    startVad()
  }
  catch (err) {
    console.error('Setup failed:', err)
    error.value = err instanceof Error ? err.message : String(err)
    isModuleLoading.value = false
  }
}

async function destroySpeechDetection() {
  await audioManager.value?.stop()
  await audioManager.value?.dispose()
  sentenceCounter.value = 0
  nextExpectedAudioIndex.value = 0
  pendingAudioBuffers.value.clear()
  audioPlaybackQueue.value = []
  isPlayingAudio.value = false // Ensure playback stops

  isInitialized.value = false
  isRunning.value = false
  isSpeechDetected.value = false

  for (const segment of segments.value) {
    URL.revokeObjectURL(segment.audioSrc)
  }

  segments.value = []
  error.value = null
  isModuleLoading.value = false
}

async function startVad() {
  try {
    ensure()
    await audioManager.value?.startMicrophone()
    isRunning.value = true
    error.value = null
  }
  catch (err) {
    console.error('Failed to start microphone:', err)
    error.value = err instanceof Error ? err.message : String(err)
  }
}

async function stopVad() {
  await audioManager.value?.stopMicrophone()
  isRunning.value = false
  isSpeechDetected.value = false
}

function toggleListening() {
  if (isRunning.value) {
    stopVad()
  }
  else {
    startVad()
  }
}

async function playNextAudio() {
  if (isPlayingAudio.value || audioPlaybackQueue.value.length === 0) {
    return
  }

  isPlayingAudio.value = true
  const audioBuffer = audioPlaybackQueue.value.shift()!

  // Create an AudioBufferSourceNode
  const source = audioContext.value!.createBufferSource()
  source.buffer = audioBuffer

  // Connect the source to the AudioContext's destination (the speakers)
  source.connect(audioContext.value!.destination)

  source.onended = () => {
    isPlayingAudio.value = false
    playNextAudio() // Play next item in queue
  }

  source.start(0)
}

onUnmounted(() => {
  dispose()
})
</script>

<template>
  <div mb-6 pb-4 mt-4 h-full w-full flex flex-col gap-2>
    <div w-full flex flex-1 flex-col gap-2>
      <Section title="Settings" icon="i-solar:settings-bold" :expand="!isInitialized">
        <div flex="~ col gap-4" max-h-70 overflow-y-scroll>
          <div>LLM</div>
          <FieldInput v-model="llmProviderBaseURL" label="LLM Provider Base URL" description="The base URL of the LLM provider. Generally, Speaches is recommended." />
          <FieldInput v-model="llmProviderAPIKey" label="LLM Provider API Key" description="The API key of the LLM provider" type="password" />
          <FieldInput v-model="llmProviderModel" label="LLM Provider Model" description="The model to use for the LLM provider" />
          <div>ASR / STT</div>
          <FieldInput v-model="asrProviderBaseURL" label="ASR Provider Base URL" description="The base URL of the ASR provider. Generally, Speaches is recommended." />
          <FieldInput v-model="asrProviderAPIKey" label="ASR Provider API Key" description="The API key of the ASR provider" type="password" />
          <FieldInput v-model="asrProviderModel" label="ASR Provider Model" description="The model to use for the ASR provider" />
          <div>TTS</div>
          <FieldInput v-model="ttsProviderBaseURL" label="TTS Provider Base URL" description="The base URL of the TTS provider. Generally, UnSpeech is recommended." />
          <FieldInput v-model="ttsProviderAPIKey" label="TTS Provider API Key" description="The API key of the TTS provider" type="password" />
          <FieldInput v-model="ttsProviderModel" label="TTS Provider Model" description="The model to use for the TTS provider" />
          <FieldInput v-model="ttsProviderVoice" label="TTS Provider Voice" description="The voice to use for the TTS provider" />
        </div>
      </Section>

      <Section title="Voice Segments" icon="i-solar:microphone-3-bold" :expand="false">
        <ul v-if="segments?.length && segments.length > 0" max-h-70 overflow-y-scroll>
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
            <audio :src="segment.audioSrc" controls w-full />
          </li>
        </ul>
      </Section>

      <div v-if="isModuleLoading" mt-20 flex items-center justify-center text-5xl>
        <div i-svg-spinners:3-dots-move />
      </div>

      <div v-if="error" class="error">
        {{ error }}
      </div>

      <div my-4 max-h-120 w-full flex flex-col gap-2 overflow-y-scroll ref="messagesContainerRef">
        <template v-for="(message, index) in messages" :key="index">
          <div v-if="message.role === 'user'" class="w-fit rounded-lg bg-cyan-100 px-3 py-2 dark:bg-cyan-900">
            {{ message.content }}
          </div>
          <div v-else-if="message.role === 'assistant'" class="w-fit rounded-lg bg-neutral-100 px-3 py-2 dark:bg-neutral-800">
            {{ message.content }}
          </div>
        </template>
      </div>
    </div>

    <div w-full flex justify-center gap-4>
      <button aspect-square size-15 flex items-center justify-center rounded-full text-2xl :class="[isRunning ? 'bg-neutral-700 dark:bg-white text-white dark:text-neutral-900' : 'bg-neutral-900 dark:bg-white/20 text-white dark:text-white', isInitialized ? 'opacity-100' : 'opacity-0']" :disabled="!isInitialized" @click="toggleListening">
        <div i-solar:microphone-3-bold />
      </button>
      <button v-if="!isInitialized" bg="green-500 dark:green-500 hover:green-400 dark:hover:green-400 active:green-500 dark:active:green-500" transition="all duration-250 ease-in-out" aspect-square size-15 flex items-center justify-center rounded-full @click="setupSpeechDetection">
        <div i-solar:phone-rounded-bold text-4xl text-white />
      </button>
      <button v-else bg="red-500 dark:red-500 hover:red-400 dark:hover:red-400 active:red-500 dark:active:red-500" transition="all duration-250 ease-in-out" aspect-square size-15 flex items-center justify-center rounded-full text-4xl text-white @click="destroySpeechDetection">
        <div i-solar:end-call-rounded-bold />
      </button>
      <button aspect-square size-15 flex items-center justify-center rounded-full text-2xl class="bg-neutral-900 text-white dark:bg-neutral-900 dark:bg-white/20 dark:text-white" :class="isInitialized ? 'opacity-100' : 'opacity-0'" :disabled="!isInitialized">
        <div i-solar:headphones-round-bold />
      </button>
    </div>
  </div>
</template>
