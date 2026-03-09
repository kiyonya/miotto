import EventEmitter from "eventemitter3"
import Equalizer from "./eq"
import { computed, watch } from "vue"
import useConfigStore from "@renderer/store/config"
import { clamp } from "lodash"

interface WAudioEvents {
    pause: () => void
    play: () => void
    load: () => void
    canplay: (duration: number) => void
    timeupdate: (currentTime: number) => void
    volumechange: (volume: number) => void
    end: () => void,
    mute:()=>void,
}

export default class WAudio extends EventEmitter<WAudioEvents> {

    private audioSource: MediaElementAudioSourceNode
    public audioElement: HTMLAudioElement
    private volumeBeforeMute: number = 1
    private equalizer: Equalizer
    public eqDefaultFrequency = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]
    public eqDefaultGain = new Array(10).fill(0)
    public eqDefaultQuality = 3
    public outputFadeGain: GainNode
    private outputAnalyserNode:AnalyserNode
    private configStore = useConfigStore()
    private playAndPauseTimeout: NodeJS.Timeout | null = null

    get currentTime() {
        return this.audioElement.currentTime
    }

    get duration() {
        return this.audioElement.duration
    }

    get paused() {
        return this.audioElement.paused
    }

    get position() {
        return this.audioElement.currentTime / this.audioElement.duration || 0
    }

    constructor() {
        super()
        this.audioElement = new Audio()
        this.audioElement.crossOrigin = 'anonymous'
        const audioCtx = new AudioContext()
        this.audioSource = audioCtx.createMediaElementSource(this.audioElement)
        this.equalizer = new Equalizer(audioCtx, this.eqDefaultFrequency, this.eqDefaultGain, this.eqDefaultQuality, 'peaking')
        this.outputFadeGain = audioCtx.createGain()
        this.outputAnalyserNode = audioCtx.createAnalyser()
        this.outputAnalyserNode.fftSize = 512

        this.audioSource.connect(this.equalizer.input)
        this.equalizer.connect(this.outputFadeGain)
        this.outputFadeGain.connect(this.outputAnalyserNode)
        this.outputAnalyserNode.connect(audioCtx.destination)

        this.startListener()
        this.setupEqualizerWatch()
    }

    public updateEqualizer(frequencies: number[], gains: number[], quality: number = 3) {
        this.equalizer.update(frequencies, gains, quality)
    }

    public enableEqualizer() {
        this.equalizer.enable()
    }

    public disableEqualizer() {
        this.equalizer.disable()
    }

    public getCurrentByteFrequencyData(){
        const dataArray = new Uint8Array(this.outputAnalyserNode.frequencyBinCount)
        this.outputAnalyserNode.getByteFrequencyData(dataArray)
        return dataArray
    }

    public getCurrentFloatFrequencyData(){
        const dataArray = new Float32Array(this.outputAnalyserNode.frequencyBinCount)
        this.outputAnalyserNode.getFloatFrequencyData(dataArray)
        return dataArray
    }

    private setupEqualizerWatch() {

        const enableEqualizer = computed(() => this.configStore.enableEqualizer)
        const equalizerFrequencies = computed(() => this.configStore.equalizerFrequencies)
        const equalizerQuality = computed(() => this.configStore.equalizerQuality)
        const equalizerGains = computed(() => this.configStore.equalizerGains)

        watch(enableEqualizer, (enable) => {
            if (enable) {
                this.enableEqualizer()
            }
            else {
                this.disableEqualizer()
            }
        })

        watch([equalizerFrequencies, equalizerGains, equalizerQuality], ([frequencies, gains, quality]) => {
            this.updateEqualizer(frequencies, gains, quality)
        }, { immediate: true, deep: true })

    }

    private startListener() {

        this.audioElement.addEventListener('pause', () => this.emit('pause'))
        this.audioElement.addEventListener('play', () => this.emit('play'))
        this.audioElement.addEventListener('load', () => this.emit('load'))
        this.audioElement.addEventListener('canplay', () => this.emit('canplay', this.audioElement.duration))
        this.audioElement.addEventListener('timeupdate', () => this.emit('timeupdate', this.audioElement.currentTime))
        this.audioElement.addEventListener('volumechange', () => {
            this.emit('volumechange', this.audioElement.volume)
            if(this.audioElement.volume === 0){
                this.emit('mute')
            }
        })
        this.audioElement.addEventListener('ended', () => this.emit('end'))
        
    }

    public async loadSrc(src: string, autoPlay: boolean = true) {
        this.audioElement.src = src
        this.audioElement.load()
        this.audioElement.pause()
        if (autoPlay) {
            this.play()
        }
    }

    public play() {
        if (!this.audioElement.paused) { return }
        this.audioElement.play()
        if (this.configStore.enableAudioFade) {
            this.outputFadeGain.gain.cancelScheduledValues(this.currentTime)
            const curve = new Float32Array(2)
            curve[0] = this.outputFadeGain.gain.value || 0
            curve[1] = 1
            this.outputFadeGain.gain.setValueCurveAtTime(curve, this.currentTime, this.configStore.audioFadeDuration / 1000)
        }
        this.playAndPauseTimeout && clearTimeout(this.playAndPauseTimeout)
        this.playAndPauseTimeout = null

    }

    public pause() {
        if (this.playAndPauseTimeout) {
            return
        }
        if (this.audioElement.paused) { return }
        if (this.configStore.enableAudioFade) {
            this.outputFadeGain.gain.cancelScheduledValues(this.currentTime)
            const curve = new Float32Array(2)
            curve[0] = this.outputFadeGain.gain.value || 1
            curve[1] = 0
            this.outputFadeGain.gain.setValueCurveAtTime(curve, this.currentTime, this.configStore.audioFadeDuration / 1000)
            if (this.playAndPauseTimeout) {
                clearTimeout(this.playAndPauseTimeout)
            }
            this.playAndPauseTimeout = setTimeout(() => {
                this.audioElement.pause()
            }, this.configStore.audioFadeDuration);
        }
        else {
            this.audioElement.pause()
            this.playAndPauseTimeout = null
        }
    }

    public seek(time: number) {
        if (this.duration) {
            this.audioElement.currentTime = clamp(time, 0, this.duration)
        }
    }

    public seekProgress(progress:number){
        if(typeof progress !== 'number'){
            return
        }
        const cprogress = clamp(progress,0,1)
        if(this.duration){
            const time = this.duration * cprogress
            this.audioElement.currentTime = time
            return time
        }
        return null
    }

    public volume(volume: number) {
        volume = clamp(volume, 0, 1)
        this.audioElement.volume = volume
    }

    public mute() {
        if (this.audioElement.muted) {
            return this.audioElement.muted
        }
        this.volumeBeforeMute = this.audioElement.volume
        this.audioElement.muted = true
        this.audioElement.volume = 0
        return this.audioElement.muted 
    }

    public unmute() {
        if (!this.audioElement.muted) {
            return this.audioElement.muted
        }
        if(this.volumeBeforeMute <= 0){
            this.volumeBeforeMute = 0.75
        }
        this.audioElement.volume = this.volumeBeforeMute
        this.audioElement.muted = false
        return this.audioElement.muted 
    }

    public toggleMute(){
        if(this.audioElement.muted){
           return this.unmute()
        }
       return this.mute()
    }

    public destory() {
        this.audioElement.remove()
    }

}