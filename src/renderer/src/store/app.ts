import { defineStore } from "pinia";

const useAppStore = defineStore('app', {
    state: () => ({
        showMusicPlayer: false,
        showSidePlaylist: false,
    }),
    actions: {
        toggleShowMusicPlayer() {
            this.showMusicPlayer = !this.showMusicPlayer
            if (this.showMusicPlayer) {
                window.emitter.post('appMusicplayerOpen', true)
            }
            else {
                window.emitter.post('appMusicplayerClose', true)
            }
        },
        openSidePlaylist() {
            this.showSidePlaylist = true
        },
        closeSidePlaylist() {
            this.showSidePlaylist = false
        }
    }
})

export { useAppStore }