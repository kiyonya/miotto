import { defineStore } from "pinia";
import { AppTypes } from "src/types/app";

interface ConfigState {
    appTheme: "dark" | "light",
    audioQuality:AppTypes.SongQuiltyLevels
    enableAudioSTMC:boolean,
    useNcmSongInfoForMatchedLocalMusic:boolean,
    useNcmLyricForMatchedLocalMusic:boolean,
    useNcmMediaSourceForMatchedLocalMusic:boolean,

    enableEqualizer:boolean,
    equalizerFrequencies: number[], 
    equalizerGains: number[], 
    equalizerQuality: number,

    enableAudioFade:boolean,
    audioFadeDuration:number,

    autoplayWhenAppStart:boolean,

    musicBackgroundMode:'dynamic' | 'cover',
    letsFishUp:boolean,
}

const useConfigStore = defineStore('config', {
    state: (): ConfigState => ({
        appTheme: 'light',
        audioQuality:'exhigh',
        enableAudioSTMC:true,
        useNcmLyricForMatchedLocalMusic:true,
        useNcmMediaSourceForMatchedLocalMusic:false,
        useNcmSongInfoForMatchedLocalMusic:true,
        equalizerFrequencies:[32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000],
        equalizerGains:new Array(10).fill(0),
        equalizerQuality:3,
        enableEqualizer:false,
        enableAudioFade:true,
        audioFadeDuration:500,
        autoplayWhenAppStart:false,
        musicBackgroundMode:'dynamic',


        letsFishUp:false
    }),
    actions:{
        toggleAppTheme(){
            if(this.appTheme === 'light'){
                this.appTheme = 'dark'
            }
            else{
                this.appTheme = 'light'
            }
            window.emitter.setPost('app::themeUpdate',this.appTheme)
            document.querySelector('html')?.setAttribute('data-theme', this.appTheme)
        },
        switchEnableEqualizer(){
            this.enableEqualizer = !this.enableEqualizer
        },
        updateEqualizerGain(gains:number[]){
            this.equalizerGains = gains.slice(0,10)
        },
        config<K extends keyof ConfigState>(key:K,value:ConfigState[K]){
            this.$state[key] = value
        }
    },
    persist: {
        afterHydrate: () => {
            const configStore = useConfigStore()
            if (configStore.appTheme) {
                 window.emitter.setPost('app::themeUpdate',configStore.appTheme)
                document.querySelector('html')?.setAttribute('data-theme', configStore.appTheme)
            }

        }
    }
})

export default useConfigStore