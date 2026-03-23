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
                window.emitter.post('app::musicplayerClose', true)
            }
            else {
                window.emitter.post('app::musicplayerOpen', true)
            }
        },
        doOpenMusicPlayer(){
            this.showMusicPlayer = true
        },
        doCloseMusicPlayer(){
            this.showMusicPlayer = false
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