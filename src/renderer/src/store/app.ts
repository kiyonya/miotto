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
                window.transapi.toEmit('appMusicplayerOpen', true)
            }
            else {
                window.transapi.toEmit('appMusicplayerClose', true)
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