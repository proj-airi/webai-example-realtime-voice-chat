class PlayerAudioProcessor extends AudioWorkletProcessor {
  private buffer: Float32Array

  constructor() {
    super()
    this.buffer = new Float32Array()
    this.port.onmessage = (event: MessageEvent<{ audioData: Float32Array }>) => {
      const newFetchedData = new Float32Array(this.buffer.length + event.data.audioData.length)
      newFetchedData.set(this.buffer, 0)
      newFetchedData.set(event.data.audioData, this.buffer.length)
      this.buffer = newFetchedData
    }
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][], _parameters: Record<string, Float32Array>): boolean {
    const output = outputs[0]
    const channel = output[0]
    const bufferLength = this.buffer.length
    for (let i = 0; i < channel.length; i++) {
      channel[i] = (i < bufferLength) ? this.buffer[i] : 0
    }
    this.buffer = this.buffer.slice(channel.length)
    return true
  }
}

class RecordAudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
  }

  process(inputs: Float32Array[][], _outputs: Float32Array[][], _parameters: Record<string, Float32Array>): boolean {
    const channel = inputs[0][0]
    if (!channel || channel.length === 0) {
      return true
    }
    const int16Array = new Int16Array(channel.length)
    for (let i = 0; i < channel.length; i++) {
      int16Array[i] = channel[i] * 32767
    }
    this.port.postMessage({ data: int16Array })
    return true
  }
}

registerProcessor('play-audio-processor', PlayerAudioProcessor)
registerProcessor('record-audio-processor', RecordAudioProcessor)
