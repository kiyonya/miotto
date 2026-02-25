
export namespace AppTypes {

    export type OnlinePlatform = 'ncm' | 'bili'
    export type OfflinePlatform = 'local'
    export type AllPlatform = OnlinePlatform
        | OfflinePlatform

    export type SearchAccuracyType = 'song' | 'playlist' | 'album' | 'artist' | 'user' | 'mv' | 'lyric' 

    export interface DefaultTransData {
        audioMute: boolean,
        audioVolumeChange: number,
        audioTimeUpdate: number,
        audioCanplay: boolean,
        audioEnd: boolean,
        audioDuration: number,
        audioPlaystateUpdate: boolean,
        audioPause: boolean,
        audioPlay: boolean,
        audioSeek: number,
        audioUserRequestPause: boolean,
        audioUserRequestPlay: boolean


        playingTrackUpdate: AppTypes.ISongTrack,
        playingSongUpdate: AppTypes.ISong,
        playingTrackIdUpdate: AppTypes.ITrackId,
        playerPlaySong: AppTypes.ITrackId,
        playingLyricUpdate: AppTypes.ILyric,
        playerPlaymodeUpdate: 'shuffle' | 'list' | 'loop' | 'listloop',
        playerPlaylistUpdate: AppTypes.ITrackId[],
        playerNextSong: [AppTypes.ITrackId, number],
        playerPreviousSong: [AppTypes.ITrackId, number],

        appMusicplayerOpen: boolean,
        appMusicplayerClose: boolean,
        appRouterUpdate: { from: string, to: string },

        appRenderReady: null,
        appRenderMount: null,



        appThemeUpdate: [string],
        playerEqualizerUpdate: number[]
    }

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

    export interface IArtistBrief {
        id: number,
        name: string,
        tns: string[],
        alias: string[],
        platform: 'ncm' | 'bili' | 'unk',
        avatar?:string
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
        publishTime?:number
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

    export interface IPlaylist {
        id: number,
        name: string,
        cover: string,
        creator?: NCMTypes.IUserProfile,
        tracks: ITrackId[],
        updateTime: number,
        createTime: number,
        trackCount: number,
        playCount: number,
        type: 'ncm' | 'custom'
        description: string
        subscribed: boolean
    }

    export interface IBiliPlaylist {

    }

    export interface IPlaylistBrief {
        id: number | string,
        type: 'ncm' | 'custom',
        cover: string,
        name: string,
        trackCount: number
    }

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

    export interface IPlayState {

    }

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

    export namespace NCMTypes {
        export interface IUserAccount {
            id: number,
            username: string,
            createTime: number,
            type: number,
            anonimousUser: boolean,
            paidFee: boolean
        }
        export interface IUserProfile {
            userId: number;
            nickname: string;
            avatarUrl: string;
            backgroundUrl: string;
            signature: string | null;
            createTime: number;
            userName: string;
            birthday: number;
            authority: number;
            gender: number;
            province: number;
            city: number;
            description: string | null;
            vipType: number;
            followed: boolean;
        }

        export type HomePageBlockCodeOrder = "HOMEPAGE_BLOCK_STYLE_RCMD" | "HOMEPAGE_BLOCK_RED_SIMILAR_SONG" | "HOMEPAGE_MUSIC_PODCAST_RCMD_BLOCK" | "HOMEPAGE_BLOCK_OLD_SUBSCRIBE_ARTIST_NEW"

    }

    export interface SearchMatchKeyword {
        keyword: string,
        platform?: OnlinePlatform
    }

    export interface ISearchSuggest {
        keywords: {
            keyword: string,
            platform?: OnlinePlatform
        }[],
        songs: {
            id: number,
            platform: OnlinePlatform,
            name: string
        }[],
        albums: {
            id: number,
            platform: OnlinePlatform,
            name: string
        }[],
        playlists: {
            id: number,
            platform: OnlinePlatform,
            name: string
        }[]
    }

    export interface ISearchComplex {
        songs:ISong[],
            playlists:IPlaylistBrief[],
            albums:IAlbumBrief[],
            artists:IArtistBrief[]
    }
}



