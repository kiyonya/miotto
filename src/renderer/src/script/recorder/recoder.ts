export interface MediaRecorderOptions {
    sampleRate?: number,
    duration?: number
}

export interface StartRecordOptions {
    maxBuffLength:number, pipeOutput: boolean
}
export class AudioMediaRecorder {

    private audioCtx: AudioContext
    private isInit: boolean = false
    private recordProcessor: AudioWorkletNode | null = null
    private sampleRate: number
    private inputStreamSource: MediaStreamAudioSourceNode | null = null

    constructor(options?: MediaRecorderOptions) {
        this.sampleRate = options?.sampleRate || 8000
        this.audioCtx = new AudioContext({ sampleRate: this.sampleRate })
        this.init()
    }

    private async init() {
        if (this.isInit) { return }
        else {
            const workletUrl = new URL('./processor.js', import.meta.url).href
            await this.audioCtx.audioWorklet.addModule(workletUrl)
            this.recordProcessor = new AudioWorkletNode(this.audioCtx, 'recorder')
            await new Promise<void>((resolve)=>{
                this.getProcessor().port.onmessage = (e)=>{
                    if(e.data.type === 'ready'){
                        resolve()
                    }
                }
            })
            console.log("初始化完成")
            this.isInit = true
        }
    }

    private getProcessor() {
        if (!this.recordProcessor) { throw new Error('No Processor! Did you init?') }
        return this.recordProcessor
    }

    public async startRecord(mediaStream: MediaStream, options?: StartRecordOptions, onBuffUpdate?: (buff: Float32Array) => void) {

        const pipeOutput = options?.pipeOutput || true

        if (!this.isInit) {
            await this.init()
        }
        const processor = this.getProcessor()
        this.inputStreamSource = this.audioCtx.createMediaStreamSource(mediaStream)
        this.inputStreamSource.connect(processor)
        return new Promise<Float32Array>((resolve, reject) => {
            const smessage = {
                type: 'start',
                ...(options?.maxBuffLength ? { maxBuffSize: options.maxBuffLength } : {}),
                pipeOutput: pipeOutput
            }
            console.log(smessage)
            processor.port.postMessage(smessage)
            processor.port.onmessage = (e) => {
                if (e.data.type === 'stop') {
                    console.log('结束')
                    const buffer = e.data.buff as Float32Array
                    resolve(buffer)
                }
                else if (e.data.type === 'error') {
                    reject()
                }
                else if (e.data.type === 'update') {
                    const currentBuff = e.data.buff
                    if (onBuffUpdate) {
                        onBuffUpdate(currentBuff)
                    }
                }
            }
        })
    }

    public stopRecord() {
        if (!this.recordProcessor) {
            throw new Error('NOTNOT')
        }
        this.recordProcessor.port.postMessage({
            type: 'stop'
        })
    }

    public clearRecord(){
        this.getProcessor().port.postMessage({type:'clear'})
    }

    public destory() {
        this.getProcessor().port.postMessage({ type: 'clear' })
        this.inputStreamSource?.disconnect()
        this.audioCtx.close()
    }

    public connect(node: AudioNode) {
        this.getProcessor().connect(node)
        return this
    }
}
