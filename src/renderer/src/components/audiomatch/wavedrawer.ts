
export default class WaveDrawer {
    private cvs: HTMLCanvasElement
    private ctx: CanvasRenderingContext2D
    private maxBarCount: number = 128
    private barColor: string = '#e11d48'
    private dpr: number = 1

    constructor(cvs: HTMLCanvasElement, acc: number = 128) {
        this.maxBarCount = acc
        this.cvs = cvs
        this.ctx = cvs.getContext('2d') as CanvasRenderingContext2D
    }

    public initDPI() {
        this.dpr = window.devicePixelRatio || 1
        const rect = this.cvs.getBoundingClientRect()
        this.cvs.width = rect.width * this.dpr
        this.cvs.height = rect.height * this.dpr
    }

    public drawBuff(buff: Float32Array, maxBuffLength: number = 0) {
        const drawValue = this.mapBuffToCount(buff, maxBuffLength)
        this.ctx.clearRect(0, 0, this.cvs.width, this.cvs.height)
        const prec = buff.length / maxBuffLength
        const recordPtrX = this.cvs.width * prec
        this.ctx.fillStyle = this.barColor
        if (buff.length < maxBuffLength) {
            this.ctx.fillRect(recordPtrX, 0, 2, this.cvs.height)
        }
        const barWidth = this.cvs.width / this.maxBarCount
        const barSpacing = Math.max(1, barWidth * 0.2)
        const actualBarWidth = barWidth - barSpacing

        for (let i = 0; i < this.maxBarCount; i++) {
            const value = drawValue[i]
            if (value === undefined) continue
            const barHeight = value * this.cvs.height
            const x = i * barWidth + barSpacing / 2
            const y = (this.cvs.height - barHeight) / 2
            this.ctx.fillRect(x, y, actualBarWidth, barHeight)
        }
    }

    public mapBuffToCount(buff: Float32Array, maxBuffLength: number): number[] {
        const fullBuff = new Float32Array(maxBuffLength)
        fullBuff.set(buff.slice(0, Math.min(buff.length, maxBuffLength)), 0)
        const samplesPerBar = Math.floor(maxBuffLength / this.maxBarCount)
        const drawValue = new Array<number>(this.maxBarCount).fill(0)
        for (let barIndex = 0; barIndex < this.maxBarCount; barIndex++) {
            const startSample = barIndex * samplesPerBar
            const endSample = Math.min(startSample + samplesPerBar, maxBuffLength)
            if (startSample >= maxBuffLength) break
            let maxAmplitude = 0
            for (let sampleIndex = startSample; sampleIndex < endSample; sampleIndex++) {
                const amplitude = Math.abs(fullBuff[sampleIndex])
                if (amplitude > maxAmplitude) {
                    maxAmplitude = amplitude
                }
            }
            drawValue[barIndex] = maxAmplitude
        }

        return drawValue
    }

    public clear() {
        this.ctx.clearRect(0, 0, this.cvs.width, this.cvs.height)
    }
}