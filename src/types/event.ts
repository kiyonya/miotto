import { AppTypes } from "./app"

export namespace AppEvents {

    export interface Events {
        audioMute:boolean
        audioVolumeChange: [volume: number],
        audioTimeUpdate: [currentTime: number],
        audioCanplay: [canPlay: boolean],
        audioEnd: boolean,
        audioDuration: [duration: number],
        audioPlaystateUpdate: boolean,
        audioPause: boolean,
        audioPlay: boolean,
        audioSeek: [seekTime: number],
        audioUserRequestPause: boolean,
        audioUserRequestPlay: boolean
        playingTrackUpdate: [track: AppTypes.ISongTrack],
        playingSongUpdate: [song: AppTypes.ISong],
        playingTrackIdUpdate: [trackId: AppTypes.ITrackId],
        playerPlaySong: [trackId: AppTypes.ITrackId],
        playingLyricUpdate: [lyric: AppTypes.ILyric],
        playerPlaymodeUpdate: [playMode: 'shuffle' | 'list' | 'loop' | 'listloop'],
        playerPlaylistUpdate: [playlist: AppTypes.ITrackId[]],
        playerNextSong: [trackId: AppTypes.ITrackId, index: number],
        playerPreviousSong: [trackId: AppTypes.ITrackId, index: number],
        appMusicplayerOpen: [isOpen: boolean],
        appMusicplayerClose: [isClose: boolean],
        appRouterUpdate: [route: { from: string, to: string }],
        appRenderReady: null,
        appRenderMount: null,
        appThemeUpdate: [theme: string],
        playerEqualizerUpdate: [f: number[]]
    }
}