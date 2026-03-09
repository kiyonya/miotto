import { AppTypes } from "./app"

export namespace AppEvents {

    export interface Events {
        "audio::mute": [mute: boolean]
        "audio::volumeChange": [volume: number]
        "audio::timeUpdate": [currentTime: number]
        "audio::canplay": [canPlay: boolean]
        "audio::end": [end: boolean]
        "audio::duration": [duration: number]
        "audio::playstateUpdate": [playstateUpdate: boolean]
        "audio::pause": [pause: boolean]
        "audio::play": [play: boolean]
        "audio::seek": [seekTime: number]
        "audio::byteFrequency": [fq: Uint8Array]
        "audio::userRequestPause": [userRequestPause: boolean]
        "audio::userRequestPlay": [userRequestPlay: boolean]
        "playing::trackUpdate": [track: AppTypes.ISongTrack]
        "playing::songUpdate": [song: AppTypes.ISong]
        "playing::trackIdUpdate": [trackId: AppTypes.ITrackId]
        "player::playSong": [trackId: AppTypes.ITrackId]
        "playing::lyricUpdate": [lyric: AppTypes.ILyric]
        "player::playmodeUpdate": [playMode: 'shuffle' | 'list' | 'loop' | 'listloop']
        "player::playlistUpdate": [playlist: AppTypes.ITrackId[]]
        "player::nextSong": [trackId: AppTypes.ITrackId, index: number]
        "player::previousSong": [trackId: AppTypes.ITrackId, index: number]
        "app::musicplayerOpen": [isOpen: boolean]
        "app::musicplayerClose": [isClose: boolean]
        "app::routerUpdate": [route: { from: string, to: string }]
        "app::renderReady": [renderReady: null]
        "app::renderMount": [renderMount: null]
        "app::themeUpdate": [theme: string]
        "player::equalizerUpdate": [f: number[]]
    }

    export type Controls = {
        "player::play": []
        "player::pause": []
        "player::next": []
        "player::playPause": []
        "player::previous": []
        "player::playTrack": [track: AppTypes.ITrackId, autoPlay: boolean]
        "player::playTrackList": [list: AppTypes.ITrackId[], start?: AppTypes.ITrackId]
        "player::setVolume": [volume: number]
        "player::seek": [time: number]
        "player::seekProgress": [progress: number]
        "player::mute": []
        "player::unmute": []
        "player::playMode": [mode: AppTypes.PlayMode]
        "player::swtichPlayMode": [],
        "audio::getByteFrequency": [],
    }

    export interface PluginAvailableEvents extends Events { }
    export interface PluginAvailableControls extends Controls {

    }
}