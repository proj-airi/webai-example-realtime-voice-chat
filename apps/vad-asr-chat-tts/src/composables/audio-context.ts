import { ref } from 'vue'

export function useAudioContext() {
  const audioContext = ref<AudioContext>()

  const ensure = () => {
    if (!audioContext.value) {
      audioContext.value = new AudioContext()
    }
    if (audioContext.value.state === 'suspended') {
      audioContext.value.resume()
    }
    if (audioContext.value.state === 'closed') {
      audioContext.value = new AudioContext()
      audioContext.value.resume()
    }
  }

  const dispose = () => {
    audioContext.value?.close()
    audioContext.value = undefined
  }

  return {
    audioContext,
    ensure,
    dispose,
  }
}
