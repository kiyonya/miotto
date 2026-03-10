declare global {

    type RestArray<T> = T extends any[] ? T : [T]

    interface PluginEvents {
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
        "audio::byteFrequency":[fq:Uint8Array]
        "audio::userRequestPause": [userRequestPause: boolean]
        "audio::userRequestPlay": [userRequestPlay: boolean]
        "playing::trackUpdate": [track: MiottoTypes.ISongTrack]
        "playing::songUpdate": [song: MiottoTypes.ISong]
        "playing::trackIdUpdate": [trackId: MiottoTypes.ITrackId]
        "player::playSong": [trackId: MiottoTypes.ITrackId]
        "playing::lyricUpdate": [lyric: MiottoTypes.ILyric]
        "player::playmodeUpdate": [playMode: 'shuffle' | 'list' | 'loop' | 'listloop']
        "player::playlistUpdate": [playlist: MiottoTypes.ITrackId[]]
        "player::nextSong": [trackId: MiottoTypes.ITrackId, index: number]
        "player::previousSong": [trackId: MiottoTypes.ITrackId, index: number]
        "app::musicplayerOpen": [isOpen: boolean]
        "app::musicplayerClose": [isClose: boolean]
        "app::routerUpdate": [route: { from: string, to: string }]
        "app::renderReady": [renderReady: null]
        "app::renderMount": [renderMount: null]
        "app::themeUpdate": [theme: string]
        "player::equalizerUpdate": [f: number[]]
    }

    interface PluginControls {
        "player::play": []
        "player::pause": []
        "player::next": []
        "player::playPause": []
        "player::previous": []
        "player::playTrack": [track: MiottoTypes.ITrackId, autoPlay: boolean]
        "player::playTrackList": [list: MiottoTypes.ITrackId[], start?: MiottoTypes.ITrackId]
        "player::setVolume": [volume: number]
        "player::seek": [time: number]
        "player::seekProgress": [progress: number]
        "player::mute": []
        "player::unmute": []
        "player::playMode": [mode: MiottoTypes.PlayMode]
        "player::swtichPlayMode": [],
        "audio::getByteFrequency": [],
    }

    interface Rectangle {
        x: number,
        y: number,
        width: number,
        height: number
    }

    interface WindowInfo {
        bounds: Rectangle,
        contentBounds: Rectangle,
        zoom: number,
        hwnd: Buffer<ArrayBufferLike>,
        title: string,
        id: number
    }

    interface Window {
        port: {
            on: <K extends keyof PluginEvents>(
                eventName: `event:${K}`,
                handler: (event: any, ...args: RestArray<PluginEvents[K]>) => void
            ) => void,
            once: <K extends keyof PluginEvents>(
                eventName: `event:${K}`,
                handler: (event: any, ...args: RestArray<PluginEvents[K]>) => void
            ) => void,
            removeListener: <K extends keyof PluginEvents>(
                eventName: `event:${K}`,
                handler: (event: any, ...args: RestArray<PluginEvents[K]>) => void
            ) => void,
            removeAllListeners: () => void,
            invoke: <K extends keyof PluginControls, R = any>(
                eventName: `ctl:${K}`,
                ...params: RestArray<PluginControls[K]>
            ) => Promise<R>,
            send: <K extends keyof PluginControls>(
                eventName: `ctl:${K}`,
                ...params: RestArray<PluginControls[K]>
            ) => void
        },
        getWindowId: () => number,
        getWindowInfo: () => Promise<WindowInfo>,
        syncEvents: () => Promise<void>,
        whenReady: () => Promise<string>
    }

    export namespace MiottoTypes {

        export type OnlinePlatform = 'ncm' | 'bili'
        export type OfflinePlatform = 'local'
        export type AllPlatform = OnlinePlatform
            | OfflinePlatform
        export type SearchAccuracyType = 'song' | 'playlist' | 'album' | 'artist' | 'user' | 'mv' | 'lyric'
        export type PlayMode = 'list' | 'listloop' | 'shuffle' | 'loop'
        export interface IBiliTrackId {
            id: string,
            platform: 'bili'
        }
        export interface INCMTrackId {
            id: number,
            platform: 'ncm'
        }
        export interface ILocalTrackId {
            id: string,
            platform: 'local',
            file: string
        }
        export type ITrackId = IBiliTrackId | INCMTrackId | ILocalTrackId
        export interface ILyric {
            pure: boolean,
            lyrics: MLyric.CombineLine[]
        }
        export namespace MLyric {
            export interface TimelineWord {
                startTime: number,
                duration: number,
                char: string
            }
            interface TimelineLyricLine {
                isTimeline: true,
                words: TimelineWord[],
                string: string
            }
            interface NormalLyricLine {
                isTimeline: false,
                string: string,
                words: null
            }
            interface BaseLine {
                effect?: {
                    align?: 'left' | 'center' | 'right',
                    color?: string,
                    bold?: boolean,
                    italic?: boolean,
                }
            }
            interface LyricLine extends BaseLine {
                type: 'lyric'
                lineStartTime: number,
                lineDuration: number,
                mainLyric: TimelineLyricLine | NormalLyricLine,
                translateLyric: TimelineLyricLine | NormalLyricLine | null,
                romaLyric: TimelineLyricLine | NormalLyricLine | null,
            }
            interface GapLine extends BaseLine {
                type: 'gap'
                lineStartTime: number,
                lineDuration: number,
            }
            interface SubLyricLine extends BaseLine {
                type: 'sublyric'
                lineStartTime: number,
                lineDuration: number,
                mainLyric: TimelineLyricLine | NormalLyricLine,
                translateLyric: TimelineLyricLine | NormalLyricLine | null,
                romaLyric: TimelineLyricLine | NormalLyricLine | null,
            }
            export type CombineLine = LyricLine | GapLine | SubLyricLine
        }
        export interface IArtistBrief {
            id: number,
            name: string,
            tns: string[],
            alias: string[],
            platform: 'ncm' | 'bili' | 'unk',
            avatar?: string
        }

        export interface IArtist {
            briefDesc: string,
            cover: string,
            avatar: string,
            name: string,
            id: number,
            musicSize: number,
            ablumSize: number,
            mvSize: number,
            alias: string[],
            transNames: string[],
            platform: 'ncm' | 'bili'
        }

        export interface IAlbumBrief {
            id: number,
            name: string,
            cover: string,
            tns: string[],
            publishTime?: number
        }

        export interface IAlbum {
            artists: IArtistBrief[],
            artist: IArtistBrief,
            publishTime: number,
            company: string,
            cover: string,
            name: string,
            id: number,
            type?: string,
            description?: string,
            followed?: boolean
        }

        export interface ILocalSong {
            name: string,
            id: string,
            type: 'local'
            artists: IArtistBrief[],
            album: IAlbumBrief
            cover: string | null,
            tns?: string[],
            duration: number,
            ncmMatchId: number | null,
            ncmCover: string | null,
            localPath: string
        }

        export interface INCMSong {
            name: string,
            mainTitle?: string,
            additionalTitle?: string,
            id: number,
            type: 'ncm'
            artists: IArtistBrief[],
            album: IAlbumBrief
            pop?: number,
            cover: string,
            mv?: number | null,
            tns?: string[],
            duration: number
        }

        export interface IBiliSong {
            name: string,
            id: string,
            bilicid: number,
            type: 'bili'
            artists: IArtistBrief[],
            album: IAlbumBrief
            cover: string,
            mv?: number | null,
            tns?: string[],
            duration: number
        }

        export type ISong = ILocalSong | INCMSong | IBiliSong

        export type SongQuiltyLevels = 'standard' | 'higher' | 'exhigh' | 'lossless' | 'hires' | 'jyeffect' | 'sky' | 'dolby'

        export interface ISongTrack {
            type: "local" | 'ncm' | 'bili'
            id: number | string,
            url: string,
            bitRate: number,
            size: number,
            gain: number,
            peek: number,
            level?: SongQuiltyLevels,
            encodeType: string,
            sampleRate: number,
            md5?: string
        }
    }
}

export { }