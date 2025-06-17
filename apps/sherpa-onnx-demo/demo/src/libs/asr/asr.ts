// Default configuration parameters
export interface ASRConfig {
  // Sample rate of the audio
  sampleRate: number
  // WebSocket endpoint for ASR service
  wsEndpoint: string
  // URL of the audio worklet
  workletUrl: string
}

export interface ASREvents {
  // Emitted when ASR result is received
  result: { text: string, finished: boolean, idx: number }
  // Emitted for status updates and errors
  status: { type: string, message: string }
}

export type ASREventCallback<K extends keyof ASREvents>
  = (event: ASREvents[K]) => void

/**
 * Automatic Speech Recognition processor
 */
export class ASR {
  private config: ASRConfig
  private audioContext: AudioContext | null = null
  private recordNode: AudioWorkletNode | null = null
  private mediaStream: MediaStream | null = null
  private ws: WebSocket | null = null
  private isRecording: boolean = false
  private eventListeners: Partial<Record<keyof ASREvents, ASREventCallback<any>[]>> = {}

  constructor(config: Partial<ASRConfig> = {}) {
    // Default configuration
    const defaultConfig: ASRConfig = {
      sampleRate: 16000,
      wsEndpoint: '/asr',
      workletUrl: '',
    }

    this.config = { ...defaultConfig, ...config }
  }

  /**
   * Add event listener
   */
  public on<K extends keyof ASREvents>(event: K, callback: ASREventCallback<K>): void {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = []
    }
    this.eventListeners[event]!.push(callback as any)
  }

  /**
   * Remove event listener
   */
  public off<K extends keyof ASREvents>(event: K, callback: ASREventCallback<K>): void {
    if (!this.eventListeners[event])
      return
    this.eventListeners[event] = this.eventListeners[event]!.filter(cb => cb !== callback)
  }

  /**
   * Emit event
   */
  private emit<K extends keyof ASREvents>(event: K, data: ASREvents[K]): void {
    if (!this.eventListeners[event])
      return
    for (const callback of this.eventListeners[event]!) {
      callback(data)
    }
  }

  /**
   * Start ASR recording and processing
   */
  public async start(): Promise<void> {
    if (this.isRecording) {
      return
    }

    try {
      // Get audio stream
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      })

      // Initialize audio context and worklet
      this.audioContext = new AudioContext({ sampleRate: this.config.sampleRate })
      await this.audioContext.audioWorklet.addModule(this.config.workletUrl)

      // Create WebSocket connection
      this.ws = new WebSocket(this.config.wsEndpoint)

      this.ws.onmessage = (e) => {
        const data = JSON.parse(e.data)
        this.emit('result', data)
      }

      // Set up audio processing
      this.recordNode = new AudioWorkletNode(this.audioContext, 'record-audio-processor')
      this.recordNode.port.onmessage = (event) => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          const int16Array = event.data.data
          this.ws.send(int16Array.buffer)
        }
      }

      const source = this.audioContext.createMediaStreamSource(this.mediaStream)
      source.connect(this.recordNode)
      this.recordNode.connect(this.audioContext.destination)

      this.isRecording = true
      this.emit('status', { type: 'info', message: 'ASR recording started' })
    }
    catch (error) {
      this.emit('status', { type: 'error', message: `Failed to start ASR: ${error}` })
      throw error
    }
  }

  /**
   * Stop ASR recording
   */
  public async stop(): Promise<void> {
    if (!this.isRecording) {
      return
    }

    // Close WebSocket
    this.ws?.close()
    this.ws = null

    // Stop media stream
    this.mediaStream?.getTracks().forEach(track => track.stop())
    this.mediaStream = null

    // Clean up audio context
    await this.audioContext?.close()
    this.audioContext = null
    this.recordNode = null

    this.isRecording = false
    this.emit('status', { type: 'info', message: 'ASR recording stopped' })
  }
}

/**
 * Create an ASR processor with the given configuration
 */
export async function createASR(config?: Partial<ASRConfig>): Promise<ASR> {
  return new ASR(config)
}
