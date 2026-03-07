import lodash, { clamp } from 'lodash'
import { AppTypes } from 'src/types/app'
import WAudio from './waudio'
import { usePlayerStore } from '@renderer/store/player'
import { usePlaylistStore } from '@renderer/store/playlist'
import useConfigStore from '@renderer/store/config'
import md5 from 'blueimp-md5'

export class Player {

    public playingId: AppTypes.ITrackId | null = null
    public waudio: WAudio
    private playerStore = usePlayerStore()
    private playlistStore = usePlaylistStore()
    private configStore = useConfigStore()
    public isPlaying: boolean = false

    public control = {
        play: () => {
            this.waudio.play()
            window.emitter.post('audio::userRequestPlay', true)
        },
        pause: () => {
            this.waudio.pause()
            window.emitter.post('audio::userRequestPause', true)
        },
        seek: (time: number) => {
            this.waudio.seek(time)
            window.emitter.post('audio::seek', time)
        },
        seekProgress: (progress: number) => {
            const seekTime = this.waudio.seekProgress(progress)
            if (seekTime) {
                window.emitter.post('audio::seek', seekTime)
            }
        },
        togglePlayPause: () => {
            if (this.isPlaying) { this.waudio.pause() }
            else { this.waudio.play() }
        },
        playPause: () => {
            if (this.isPlaying) { this.waudio.pause() }
            else { this.waudio.play() }
        },
        volume: (volume: number) => this.waudio.volume(volume),
        mute:()=>{
            this.waudio.mute(),
            window.emitter.post('audio::mute',true)
        },
        unmute:()=>{
            this.waudio.unmute(),
            window.emitter.post('audio::mute',false)
        },
        next:()=>this.next(),
        previous:()=>this.previous(),
        playMode:(playMode:AppTypes.PlayMode)=>this.playerStore.setPlayMode(playMode),
        switchPlayMode:()=>this.playerStore.switchPlaymode(),
        movePlaylistItem:(from:number,to:number)=>this.playerStore.movePlaylistItem(from,to)
    }

    constructor(waudio?: WAudio) {
        this.waudio = waudio || new WAudio()
        this.addWAudioListener()
        this.addPlayerControlListener()
        this.addSystemMediaSessionListener()

        if (this.playerStore.onplay?.trackId) {
            this.playingId = this.playerStore.onplay?.trackId
            this.playTrack(this.playingId, this.configStore.autoplayWhenAppStart)
        }
    }

    private addWAudioListener() {
        this.waudio.on('play', () => {
            this.playerStore.updatePlayState(true)
            window.emitter.setPost('audio::playstateUpdate', true)
            window.emitter.post('audio::play', true)
            this.isPlaying = true
        })
        this.waudio.on('pause', () => {
            this.playerStore.updatePlayState(false)
            window.emitter.setPost('audio::playstateUpdate', false)
            window.emitter.post('audio::pause', true)
            this.isPlaying = false
        })
        this.waudio.on('timeupdate', (ct: number) => {
            this.playerStore.updateCurrentTime(ct)
            window.emitter.setPost('audio::timeUpdate', ct)
            this.updateSystemMediaSessionPlayState()
        })
        this.waudio.on('canplay', (dt: number) => {
            this.playerStore.updateDuration(dt)
            window.emitter.setPost('audio::duration', dt)
            window.emitter.post('audio::canplay', true)
        })
        this.waudio.on('end', this.handleAudioEnd.bind(this))
        this.waudio.on('volumechange', (volume: number) => {
            window.emitter.setPost('audio::volumeChange', volume)
        })
    }

    private addPlayerControlListener() {
        window.electron.ipcRenderer.on('control:playerPause', () => {
            this.control.pause()
        })
        window.electron.ipcRenderer.on('control:playerPlay', () => {
            this.control.play()
        })
        window.electron.ipcRenderer.on('control:playerNext', () => {
            this.next()
        })
        window.electron.ipcRenderer.on('control:playerPrevious', () => {
            this.previous()
        })
        window.electron.ipcRenderer.on('control:playerToggle', () => {
            this.control.togglePlayPause()
        })
        window.electron.ipcRenderer.on('control:playMode', (_, playMode: AppTypes.PlayMode) => {
            this.playerStore.setPlayMode(playMode)
        })
        window.electron.ipcRenderer.on('control:playModeSwitch', () => {
            this.playerStore.switchPlaymode()
        })
        window.electron.ipcRenderer.on('control:playerPlayTrack', (_, track: AppTypes.ITrackId) => {
            this.playTrack(track)
        })
        window.electron.ipcRenderer.on('control:playerSetVolume', (_, volume: number) => {
            const v = clamp(volume, 0, 1)
            this.control.volume(v)
        })
        window.electron.ipcRenderer.on('control:playerSeek', (_, seek: number) => {
            const seekTime = Number(seek)
            if (seekTime && Number.isSafeInteger(seekTime)) {
                this.control.seek(seekTime)
            }
        })
    }

    private handleAudioEnd() {
        const playMode = this.playerStore.player.playMode
        window.emitter.post('audio::end', true)
        if (playMode === 'loop') {
            this.waudio.seek(0)
            return
        }
        else {
            this.next()
        }
    }

    get list(): AppTypes.ITrackId[] {
        return this.playerStore.playlist
    }

    set list(listArray: AppTypes.ITrackId[]) {
        const shuffleList = lodash.shuffle(listArray)
        this.playerStore.setPlayerList(listArray, shuffleList)
    }

    public next() {
        const currentIndex = this.playerStore.getIndex()
        let nextIndex = currentIndex + 1
        console.log(nextIndex)
        if (nextIndex >= this.list.length) {
            if (this.playerStore.player.playMode === 'listloop') {
                nextIndex = 0
            } else {
                return
            }
        }
        const nextTrackId = this.list[nextIndex]

        window.emitter.post('player::nextSong', this._noProxy(nextTrackId), nextIndex)


        this.playTrack(nextTrackId)
    }

    public previous() {
        const currentIndex = this.playerStore.getIndex()
        let preIndex = currentIndex - 1
        if (preIndex < 0) {
            if (this.playerStore.player.playMode === 'listloop') {
                preIndex = this.list.length - 1
            }
            else {
                return
            }
        }
        const preTrackId = this.list[preIndex]

        window.emitter.post('player::previousSong', this._noProxy(preTrackId), preIndex)

        this.playTrack(preTrackId)
    }

    public async playTrack(trackId: AppTypes.ITrackId, autoPlay: boolean = true) {
        this.playingId = trackId

        window.emitter.post('player::playSong', this._noProxy(trackId))

        if (trackId.platform === 'ncm') {
            await this.playNcmTrack(trackId, autoPlay)
        }
        else if (trackId.platform === 'bili') {
            await this.playBiliTrack(trackId, autoPlay)
        }
        else if (trackId.platform === 'local') {
            await this.playLocalTrack(trackId, autoPlay)
        }

    }

    private async playNcmTrack(trackId: AppTypes.ITrackId, autoPlay: boolean = true) {
        const ncmid = trackId.id as unknown as number
        const track = await this.getSourceFromNCM(ncmid)
        track.url = track.url.replaceAll('http://', 'https://')
        await this.waudio.loadSrc(track.url, autoPlay)
        const detail = await window.ncmapi.songDetail(ncmid, true)
        const lyric = await this.getLyricFromNCM(ncmid)

        this.updateSystemMediaSession(detail[0])
        this.playerStore.setOnPlayTrack(track, detail[0], trackId)
        this.playerStore.setLyric(lyric)
    }

    private async playBiliTrack(trackId: AppTypes.IBiliTrackId, autoPlay: boolean = true) {
        const bvid = trackId.id
        const detail = await window.biliapi.songDetail(bvid)
        const track = await this.getSourceFromBili(bvid, detail.bilicid)
        await this.waudio.loadSrc(track.url, autoPlay)

        this.updateSystemMediaSession(detail)
        this.playerStore.setOnPlayTrack(track, detail, trackId)
        this.playerStore.setLyric({
            pure: true,
            lyrics: []
        })
    }

    private async playLocalTrack(localId: AppTypes.ILocalTrackId, autoPlay: boolean = true) {
        const lid = localId.id
        const file = localId.file
        await this.waudio.loadSrc(file, autoPlay)
        let detail: AppTypes.ISong = await this.playlistStore.getSong(lid)
        if (detail.type === 'local') {
            if (this.configStore.useNcmSongInfoForMatchedLocalMusic && detail.ncmMatchId) {
                const ncmDetail = await window.ncmapi.songDetail(detail.ncmMatchId, true)
                if (ncmDetail.length) {
                    detail = this.playlistStore.injectNcmDetailToLocalMusic(detail, ncmDetail[0])
                }
            }
            let track: AppTypes.ISongTrack
            if (this.configStore.useNcmMediaSourceForMatchedLocalMusic && detail.ncmMatchId) {
                track = await this.getSourceFromNCM(detail.ncmMatchId)
            }
            else {
                track = await window.localapi.getLocalTrack(file)
            }
            if (this.configStore.useNcmLyricForMatchedLocalMusic && detail.ncmMatchId) {
                const lyric = await this.getLyricFromNCM(detail.ncmMatchId)
                this.playerStore.setLyric(lyric)
            }
            else {
                this.playerStore.setLyric({
                    pure: true,
                    lyrics: []
                })
            }
            this.updateSystemMediaSession(detail)
            this.playerStore.setOnPlayTrack(track, detail, localId)
        }
    }

    private async getSourceFromNCM(ncmid: number): Promise<AppTypes.ISongTrack> {
        const ck = `ncm-${ncmid}-${this.configStore.audioQuality}`
        const ckmd5 = md5(ck)
        const cache = await window.cacheapi.getAudioTrack(ckmd5)
        if (cache) {
            return cache
        }
        const track = await window.ncmapi.songUrl(ncmid, this.configStore.audioQuality)
        window.cacheapi.cacheAudioTrack(ckmd5, track)
        return track
    }

    private async getSourceFromBili(bv: string, cid: number): Promise<AppTypes.ISongTrack> {
        const ck = `bili-${bv}-${cid}`
        const ckmd5 = md5(ck)
        const cache = await window.cacheapi.getAudioTrack(ckmd5)
        if (cache) {
            return cache
        }
        const track = await window.biliapi.bvAudioTrack(bv, cid)
        window.cacheapi.cacheAudioTrack(ckmd5, track)
        return track
    }

    private async getLyricFromNCM(ncmid: number): Promise<AppTypes.ILyric> {
        const idmd5 = md5(String(ncmid))
        const cache = await window.cacheapi.getLyric(idmd5)
        if (cache) {
            return cache
        }
        const lyric = await window.ncmapi.songLyric(ncmid)
        window.cacheapi.cacheLyric(idmd5, lyric)
        return lyric
    }

    public async playPlaylist(id: string | number, type: 'custom' | 'ncm', playId?: AppTypes.ITrackId) {
        if (type === 'ncm' && typeof id === 'number') {
            const playlist = await window.ncmapi.playlistDetail(id, true)
            const trackIds: AppTypes.ITrackId[] = playlist.tracks
            this.playTrackList(trackIds, playId)

        }
        else if (typeof id === 'string') {
            const playlist = await this.playlistStore.getPlaylist(id)
            const trackIds = playlist.tracks
            this.playTrackList(trackIds)
        }
    }

    private addSystemMediaSessionListener() {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.setActionHandler('play', () => {
                this.control.play()
            })
            navigator.mediaSession.setActionHandler('pause', () => {
                this.control.pause()
            })
            navigator.mediaSession.setActionHandler('previoustrack', () => {
                this.previous()
            })
            navigator.mediaSession.setActionHandler('nexttrack', () => {
                this.next()
            })
            navigator.mediaSession.setActionHandler('stop', () => {
                this.control.pause()
            })
            navigator.mediaSession.setActionHandler('seekbackward', (event) => {
                this.control.seek(this.waudio.currentTime - (event.seekTime || 10))
            })
            navigator.mediaSession.setActionHandler('seekforward', (event) => {
                this.control.seek(this.waudio.currentTime - (event.seekTime || 10))
            })
        }
    }

    private updateSystemMediaSession(song: AppTypes.ISong) {
        const meta: MediaMetadataInit = {
            title: song?.name,
            artist: song?.artists?.map((a) => a.name).join(','),
            album: song?.album?.name,
            artwork: [
                {
                    src: song?.cover || '',
                    type: 'image/jpg',
                    sizes: '224x224'
                },
                {
                    src: song?.cover || '',
                    type: 'image/jpg',
                    sizes: '512x512'
                }
            ]
        }
        navigator.mediaSession.metadata = new MediaMetadata(meta)
    }

    private updateSystemMediaSessionPlayState() {
        if ('setPositionState' in navigator.mediaSession) {
            const duration = this.waudio.duration
            if (duration !== undefined && !isNaN(duration)) {
                navigator.mediaSession.setPositionState({
                    duration: duration,
                    playbackRate: 1.0,
                    position: this.waudio.currentTime
                })
            }
        }
    }


    public insertAfter(trackId: AppTypes.ITrackId) {
        const currentIndex = this.playerStore.getIndex()
        this.list.splice(currentIndex + 1, 0, trackId)
    }

    public insertBefore(trackId: AppTypes.ITrackId) {
        const currentIndex = this.playerStore.getIndex()
        const insertIndex = currentIndex - 1
        if (insertIndex < 0) {
            this.list.unshift(trackId)
        }
        else {
            this.list.splice(insertIndex, 0, trackId)
        }
    }

    public playTrackList(trackIds: AppTypes.ITrackId[], playId?: AppTypes.ITrackId) {
        const isListSame = this.compareTrackListEqual(trackIds, this.list)
        if (!isListSame) {
            this.replaceTrackList(trackIds)
        }
        const trackToPlay = playId || this.list[0]
        this.playTrack(trackToPlay)
    }

    private replaceTrackList(trackIds: AppTypes.ITrackId[]) {
        this.list = trackIds
    }

    private compareTrackListEqual(arr1: AppTypes.ITrackId[], arr2: AppTypes.ITrackId[]): boolean {
        if (arr1.length !== arr2.length) return false;
        const createMap = (arr: AppTypes.ITrackId[]) => {
            const map = new Map<string, Set<string | number>>();
            for (const track of arr) {
                const key = track.platform;
                if (!map.has(key)) {
                    map.set(key, new Set());
                }
                map.get(key)!.add(track.id);
            }

            return map;
        };
        const map1 = createMap(arr1);
        const map2 = createMap(arr2);
        if (map1.size !== map2.size) return false;
        for (const [platform, ids1] of map1) {
            const ids2 = map2.get(platform);
            if (!ids2) return false;
            if (ids1.size !== ids2.size) return false;
            for (const id of ids1) {
                if (!ids2.has(id)) return false;
            }
        }
        return true;
    }

    private _noProxy(obj: any) {
        return JSON.parse(JSON.stringify(obj))
    }
}

