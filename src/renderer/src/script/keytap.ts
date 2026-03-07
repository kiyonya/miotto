import Mousetrap from "mousetrap";

export function setupKeyListener(){
    Mousetrap.bind('MediaPlayPause',()=>{
        window.$player.control.togglePlayPause()
    })
    Mousetrap.bind('AudioVolumeUp',()=>{
        console.log('vmp')
    })
    Mousetrap.bind('b a d a p p l e',()=>{
        new Notification("BAD APPLE !!")
        window.$player.playTrack({
            id:22645196,
            platform:'ncm'
        })
    })
}