export interface AudioState{
    currentTime: number,
    name: string,
    isPlaying: boolean,
    totalTime: number,
    trackInfor: MiottoTypes.ISong | null,
}   

export interface Action {
    type: string,
    isPlaying?: boolean,
    currentTime?: number,
    totalTime?: number,
    trackInfor?: MiottoTypes.ISong,
}

export const initialization: AudioState= {
    currentTime: 0,
    name: "",
    isPlaying: false,
    totalTime: 0,
    trackInfor: null,
}

export function reducer(state: AudioState , actions: Action){
    switch(actions.type){
            case "isPause": {
                if( actions.isPlaying === undefined ){ throw new Error("no argments!") }
                return {
                    ...state,
                    isPlaying: actions.isPlaying
                }
            }case "setTotalTime": {
                if( actions.totalTime === undefined ){ throw new Error("undefined totalTime") }
                return {
                    ...state,
                    totalTime: actions.totalTime
                }
            }case "setCurrentTime": {
                if( actions.currentTime === undefined ){ throw new Error("undefined CurrentTime") }
                return {
                    ...state,
                    currentTime: actions.currentTime,
                }
            }case "setProgress": {
                if( actions.currentTime === undefined){ throw new Error("progrss is undefined!") }
                
                window.port.invoke("ctl:player::seek", Math.floor(actions.currentTime))
                return{
                    ...state,
                    currentTime: actions.currentTime
                }             
            }case "setTrackInfor": {
                if( !actions.trackInfor ){ throw new Error("undefined trackInformation!") }
                return{
                    ...state,
                    trackInfor: actions.trackInfor,
                }
            }
            default :{
                throw new Error("undefined type")
            }
        }
    }