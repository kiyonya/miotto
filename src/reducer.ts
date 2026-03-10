export interface AudioState {
    currentTime: number,
    name: string,
    isPlaying: boolean,
    totalTime: number
}   

export interface Action {
    type: string,
    isPlaying?: boolean,
    currentTime?: number
    totalTime?: number
}

export const initialization: AudioState = {
    currentTime: 0,
    name: "",
    isPlaying: false,
    totalTime: 0,
}

export function reducer(state: AudioState, actions: Action){
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
            }
            default :{
                throw new Error("undefined type")
            }
        }
    }