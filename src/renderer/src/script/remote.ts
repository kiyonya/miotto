import { AppTypes } from "src/types/app"
import { AppEvents } from "src/types/event"

const remoteControlHandlers: Record<keyof AppEvents.Controls, (...args: any[]) => void> = {
    "player::play": () => window.$player.control.play(),
    "player::pause": () => window.$player.control.pause(),
    "player::playPause":()=>window.$player.control.playPause(),
    "player::next": () => window.$player.control.next(),
    "player::previous": () => window.$player.control.previous(),
    "player::playTrack": (track: AppTypes.ITrackId, autoPlay: boolean) => window.$player.playTrack(track, autoPlay),
    "player::playTrackList": (list: AppTypes.ITrackId[], start?: AppTypes.ITrackId) => window.$player.playTrackList(list, start),
    "player::setVolume": (volume: number) => window.$player.control.volume(volume),
    "player::seek": (time: number) => window.$player.control.seek(time),
    "player::seekProgress": (progress: number) => window.$player.control.seekProgress(progress),
    "player::mute": () => window.$player.control.mute(),
    "player::unmute": () => window.$player.control.unmute(),
    "player::playMode": (mode: AppTypes.PlayMode) => window.$player.control.playMode(mode),
    "player::swtichPlayMode": () => window.$player.control.switchPlayMode(),
    "audio::getByteFrequency":()=>{
        const u8array = window.$player.waudio.getCurrentByteFrequencyData()
        window.emitter.post('audio::byteFrequency',u8array)
    }
}

export function addRemoteControlHandler() {
    for (const [propKey, handler] of Object.entries(remoteControlHandlers)) {
        window.electron.ipcRenderer.on(`ctl:${propKey}`, (_, ...args: any[]) => handler(...args))
    }
}