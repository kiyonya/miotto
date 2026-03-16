import type { Action } from "./reducer.ts"

function addListeners(dispatch: React.ActionDispatch<[Action]>): void{
        
    window.port.on("event:audio::pause",(_, isPause)=> {
        dispatch({
            type: "isPause",
            isPlaying: !isPause
        })
    })

    window.port.on("event:audio::play",(_, play)=>{
        dispatch({
            type: "isPause",
            isPlaying: play
        })
    })

    window.port.on("event:audio::duration", (_, duration) => {
        dispatch({
            type: "setTotalTime",
            totalTime: duration
        })
    })

    window.port.on("event:audio::timeUpdate", (_, ct)=> {
        dispatch({
            type: "setCurrentTime",
            currentTime: ct
        })
    })

    window.port.on("event:playing::songUpdate", (_, song)=> {
        dispatch({
            type: "setTrackInfor",
            trackInfor: song,
        })
    })
}

export default async function setListeners(dispatch: React.ActionDispatch<[Action]>){
    await window.whenReady()

    addListeners(dispatch)

    window.syncEvents()
}