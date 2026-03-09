
import { defineStore } from "pinia";
import { AppTypes } from "src/types/app";

function isISong(song: AppTypes.ISong | AppTypes.ITrackId): song is AppTypes.ISong {
    return 'name' in song && 'artists' in song
}

function isITrackId(song: AppTypes.ISong | AppTypes.ITrackId): song is AppTypes.ITrackId {
    return 'id' in song && 'trackId' in song
}

interface AudioState {
    playing: boolean,
    muted: boolean,
    volume: number,
    currentTime: number,
    duration?: number,
}

interface PlayerStoreState {
    audioState: AudioState
    onplay: {
        track: AppTypes.ISongTrack,
        song: AppTypes.ISong,
        trackId: AppTypes.ITrackId
    } | null,
    player: {
        playMode: 'shuffle' | 'list' | 'loop' | 'listloop',
        list: AppTypes.ITrackId[],
        shuffleList: AppTypes.ITrackId[]
    },
    lyric: AppTypes.ILyric | null
}

const usePlayerStore = defineStore('player', {
    state: (): PlayerStoreState => ({
        audioState: {
            muted: false,
            playing: true,
            volume: 1,
            currentTime: 0,
            duration: 0
        },
        onplay: null,
        player: {
            playMode: 'shuffle',
            shuffleList: [],
            list: []
        },
        lyric: null
    }),

    actions: {
        getIndex(trackId?: AppTypes.ITrackId): number {
            const findId = trackId || this.onplay?.trackId
            if (!findId) { return 0 }
            let index = 0
            for (const track of this.playlist) {
                if (track.id === findId.id && track.platform === findId.platform) {
                    return index
                }
                index++
            }
            return index
        },
        setPlayMode(playMode: 'shuffle' | 'list' | 'loop' | 'listloop') {
            this.player.playMode = playMode

            window.emitter.setPost('player::playmodeUpdate', playMode)
            window.emitter.setPost('player::playlistUpdate', this._noProxy(this.playlist))

        },
        switchPlaymode() {
            if (this.player.playMode === 'shuffle') {
                this.setPlayMode('list')
            }
            else {
                this.setPlayMode('shuffle')
            }
        },
        setPlayerList(rawList: AppTypes.ITrackId[], shuffleList: AppTypes.ITrackId[]) {
            this.player.list = rawList
            this.player.shuffleList = shuffleList

            window.emitter.setPost('player::playlistUpdate', this._noProxy(this.playlist))
        },

        setLyric(lyric: AppTypes.ILyric) {
            this.lyric = lyric

            window.emitter.setPost('playing::lyricUpdate', lyric)
        },
        setOnPlayTrack(track: AppTypes.ISongTrack, song: AppTypes.ISong, trackId: AppTypes.ITrackId) {
            this.onplay = {
                track: track,
                song: song,
                trackId: trackId
            }

            window.emitter.setPost('playing::trackUpdate', track)
            window.emitter.setPost('playing::trackIdUpdate', this._noProxy(trackId))
            window.emitter.setPost('playing::songUpdate',song)

        },
        updateCurrentTime(currentTime: number) {
            this.audioState.currentTime = currentTime
        },
        updateDuration(duration: number) {
            this.audioState.duration = duration
        },
        updateVolume(volume: number) {
            this.audioState.volume = volume
            if(volume <= 0){
                this.audioState.muted = true
                window.emitter.post('audio::mute',true)
            }
            else{
                const isMuted = this.audioState.muted
                if(isMuted){
                    window.emitter.post('audio::mute',false)
                }
                this.audioState.muted = false
            }
        },
        updatePlayState(isPlaying: boolean) {
            this.audioState.playing = isPlaying
        },
        updateMuteState(muted: boolean) {
            this.audioState.muted = muted
        },
        movePlaylistItem(from: number, to: number) {
            if (from < 0 || to < 0) { return }
            const rawList = [...this.player.list]
            if (from < rawList.length && to < rawList.length) {
                const [movedItem] = rawList.splice(from, 1)
                rawList.splice(to, 0, movedItem)
                this.player.list = rawList
            }
            const shuffleList = [...this.player.shuffleList]
            if (shuffleList.length > 0 && from < shuffleList.length && to < shuffleList.length) {
                const [movedItem] = shuffleList.splice(from, 1)
                shuffleList.splice(to, 0, movedItem)
                this.player.shuffleList = shuffleList
            }
            window.emitter.setPost('player::playlistUpdate', this._noProxy(this.playlist))
        },
        isPlaying(song: AppTypes.ISong | AppTypes.ITrackId): boolean {
            if (isISong(song)) {
                if (song.id === this.onplay?.song.id && song.type === this.onplay.song.type) {
                    return true
                }
            }
            else if (isITrackId(song)) {
                if (song.id === this.onplay?.trackId.id && song.platform === this.onplay.trackId.platform) {
                    return true
                }
            }
            return false
        },
        _noProxy(obj: any) {
            return JSON.parse(JSON.stringify(obj))
        }
    },
    getters: {
        playlist(state): AppTypes.ITrackId[] {
            if (state.player.playMode === 'shuffle') {
                return state.player.shuffleList
            }
            return state.player.list
        }
    },
    persist: {
        pick: ['audioState', 'player', 'onplay']
    }
})

export { usePlayerStore }