import EventEmitter from "eventemitter3"
import Equalizer from "./eq"

interface WAudioEvents {
    pause: () => void
    play: () => void
    load: () => void
    canplay: (duration: number) => void
    timeupdate: (currentTime: number) => void
    volumechange:(volume:number) => void
    end: () => void
}

export default class WAudio extends EventEmitter<WAudioEvents> {

    private audioSource: MediaElementAudioSourceNode
    public audioElement: HTMLAudioElement
    private volumeBeforeMute:number = 1
    private equalizer:Equalizer
    public eqDefaultFrequency = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]
    public eqDefaultGain = new Array(10).fill(0)
    public eqDefaultQuality = 3

    get currentTime(){
        return this.audioElement.currentTime
    }

    get duration(){
        return this.audioElement.duration
    }

    get paused(){
        return this.audioElement.paused
    }

    get position(){
        return this.audioElement.currentTime / this.audioElement.duration || 0
    }

    constructor() {
        super()
        this.audioElement = new Audio()
        this.audioElement.crossOrigin = 'anonymous'
        const audioCtx = new AudioContext()
        this.audioSource = audioCtx.createMediaElementSource(this.audioElement)
        this.equalizer = new Equalizer(audioCtx,this.eqDefaultFrequency,this.eqDefaultGain,this.eqDefaultQuality,'peaking')
        this.audioSource.connect(this.equalizer.input)
        this.equalizer.connect(audioCtx.destination)

        this.startListener()
    }

    public updateEqualizer(frequencies: number[], gains: number[], quality: number = 3){
        this.equalizer.update(frequencies,gains,quality)
    }
    public enalbeEqualizer(){
        this.equalizer.enable()
    }
    public disableEqualizer(){
        this.equalizer.disable()
    }
    private startListener() {

        this.audioElement.addEventListener('pause', () => this.emit('pause'))
        this.audioElement.addEventListener('play', () => this.emit('play'))
        this.audioElement.addEventListener('load', () => this.emit('load'))
        this.audioElement.addEventListener('canplay', () => this.emit('canplay', this.audioElement.duration))
        this.audioElement.addEventListener('timeupdate', () => this.emit('timeupdate', this.audioElement.currentTime))
        this.audioElement.addEventListener('volumechange',()=>this.emit('volumechange',this.audioElement.volume))
        this.audioElement.addEventListener('ended', () => this.emit('end'))

    }
    public async loadSrc(src: string, autoPlay: boolean = true) {
        this.audioElement.src = src
        this.audioElement.load()
        this.audioElement.pause()
        if (autoPlay) {
            await this.audioElement.play()
        }
    }
    public play() {
        if (!this.audioElement.paused) { return }
        this.audioElement.play()
    }
    public pause() {
        if (this.audioElement.paused) { return }
        this.audioElement.pause()
    }
    public seek(time: number) {
        this.audioElement.currentTime = time
    }
    public volume(volume:number){
        volume = Math.max(0,volume)
        volume = Math.min(volume,1)
        this.audioElement.volume = volume
    }
    public mute(){
        if(this.audioElement.muted){
            return
        }
        this.volumeBeforeMute = this.audioElement.volume
        this.audioElement.volume = 0
    }
    public unmute(){
        if(!this.audioElement.muted){
            return
        }
        this.audioElement.volume = this.volumeBeforeMute
    }
    public destory(){
        this.audioElement.remove()
    }

}