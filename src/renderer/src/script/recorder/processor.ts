declare class AudioWorkletProcessor {
    readonly port: MessagePort;
    constructor(options?: AudioWorkletNodeOptions);
}

declare function registerProcessor<T extends AudioWorkletProcessor>(
    name: string,
    processorCtor: new (options?: AudioWorkletNodeOptions) => T
): void;

interface StartEvent {
    type: 'start',
    maxBuffSize?: number,
    pipeOutput?: boolean
}

interface EndEvent {
    type: 'end'
}

interface ClearEvent {
    type: 'clear'
}

type RecorderEvent = StartEvent | EndEvent | ClearEvent

class AudioRecorderProcessor extends AudioWorkletProcessor {

    private recording: boolean = false
    private recordBuffers: Float32Array[] = []
    private totalSamples: number = 0
    private maxBufSize?: number
    private pipeOutput?: boolean

    constructor() {
        super()
        this.port.addEventListener('message', this.messageHandler.bind(this))
        this.port.start()
        this.port.postMessage({ type: 'ready' })
    }

    private messageHandler(event: MessageEvent<RecorderEvent>) {
        console.log('Processor received message:', event.data)

        switch (event.data.type) {
            case 'start':
                this.maxBufSize = event.data.maxBuffSize
                this.pipeOutput = event.data.pipeOutput ?? true
                this.startRecord()
                break
            case 'end':
                this.endRecord()
                break
            case 'clear':
                this.clearRecord()
                break
        }
    }

    private startRecord() {
        if (this.recording) {
            return
        }
        this.recording = true
        this.recordBuffers = []
        this.totalSamples = 0
        this.port.postMessage({ type: 'started' })
    }

    private endRecord() {
        if (this.recording) {
            this.recording = false;
            const combinedBuffer = new Float32Array(this.totalSamples);
            let offset = 0;
            for (const buffer of this.recordBuffers) {
                combinedBuffer.set(buffer, offset);
                offset += buffer.length;
            }
            this.port.postMessage({
                type: 'stop',
                bufLength: this.totalSamples,
                buff: combinedBuffer
            });
        }
    }

    private clearRecord() {
        this.recordBuffers = []
        this.totalSamples = 0
        this.recording = false
    }

    public process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
        try {
            const inputChannel = inputs[0]?.[0]
            if (inputChannel && this.recording && inputChannel.length > 0) {
                if (this.maxBufSize && this.totalSamples + inputChannel.length > this.maxBufSize) {
                    const remainingSamples = this.maxBufSize - this.totalSamples;
                    if (remainingSamples > 0) {
                        const partialData = inputChannel.slice(0, remainingSamples);
                        this.recordBuffers.push(new Float32Array(partialData));
                        this.totalSamples += remainingSamples;
                    }
                    this.endRecord();
                } else {
                    this.recordBuffers.push(new Float32Array(inputChannel));
                    this.totalSamples += inputChannel.length;
                    if (this.totalSamples % 256 < 128) {
                        const previewBuffer = new Float32Array(this.totalSamples);
                        let offset = 0;
                        for (const buffer of this.recordBuffers) {
                            previewBuffer.set(buffer, offset);
                            offset += buffer.length;
                        }
                        this.port.postMessage({
                            type: 'update',
                            buff: previewBuffer
                        });
                    }
                }
            }
            if (this.pipeOutput && outputs.length > 0) {
                for (let i = 0; i < outputs.length; i++) {
                    for (let j = 0; j < outputs[i].length; j++) {
                        if (inputs[i]?.[j]) {
                            outputs[i][j].set(inputs[i][j]);
                        }
                    }
                }
            }
            return true
        } catch (error) {
            this.port.postMessage({ type: 'error', error: String(error) })
            return true
        }
    }
}

registerProcessor('recorder', AudioRecorderProcessor)