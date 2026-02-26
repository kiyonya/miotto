import { App, createApp } from 'vue'
import LoginWindow from './LoginWindow.vue'
import CreatePlaylist from './CreatePlaylist.vue'
import { AppTypes } from 'src/types/app'
import ImportBiliMusic from './ImportBiliMusic.vue'
import ContextMenu from "./ContextMenu.vue";
import Equalizer from './Equalizer.vue'
import CreateDevProject from './CreateDevProject.vue'
interface ContextMenuItems {
  label?: string,
  icon?: string,
  overTip?: string,
  split?: boolean,
  onClick?: () => void,
  disabled?: boolean
}
interface ContextMenuCreateOptions {
  x: number,
  y: number,
  items: ContextMenuItems[]
}

type CloseWindow = () => void

export default abstract class FunctionalWindows {
  public static showLoginWindow(onClose?: () => void): CloseWindow {
    const container = document.createElement('div')
    const app = createApp(LoginWindow, {
      onClose: () => {
        app.unmount()
        container.remove()
        onClose?.()
      }
    })
    document.body.appendChild(container)
    app.mount(container)
    const closeCaller = () => {
      app.unmount()
      container.remove()
    }
    return closeCaller
  }

  public static showCreatePlaylistWindow() {
    const container = document.createElement('div')
    return new Promise<string>((resolve, reject) => {
      const app = createApp(CreatePlaylist, {
        onClose: () => {
          app.unmount()
          container.remove()
          reject('canceled')
        },
        onCreate: (playlistName: string) => {
          app.unmount()
          container.remove()
          resolve(playlistName)
        }
      })
      document.body.appendChild(container)
      app.mount(container)
    })

  }

  public static showBiliMusicImportWindow() {
    const container = document.createElement('div')
    return new Promise<{ canceled: boolean, song: AppTypes.IBiliSong | null }>((resolve) => {
      const app = createApp(ImportBiliMusic, {
        onClose: () => {
          app.unmount()
          container.remove()
          resolve({
            canceled: true,
            song: null
          })
        },
        onImport: (biliSong: AppTypes.IBiliSong) => {
          app.unmount()
          container.remove()
          resolve({
            canceled: false,
            song: biliSong
          })
        }
      })
      document.body.appendChild(container)
      app.mount(container)
    })
  }

  public static showContextMenu(options: ContextMenuCreateOptions, onMounted?: (app: App<Element>) => void, onUnmounted?: () => void): {withFocus:(el:HTMLElement)=>void} {
    const mountEl = document.createElement('div')
    document.body.appendChild(mountEl)
    const menu = createApp(ContextMenu, {
      ...options
    })
    let focusEl:HTMLElement | null = null
    const withFocus = (el:HTMLElement)=>{
      el.tabIndex = 0
      focusEl = el
      el.focus()
    }
    const removeFocus = ()=>{
      focusEl?.removeAttribute('tabindex')
      focusEl?.blur()
      focusEl = null
    }
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      menu.unmount()
      mountEl.remove()
      document.removeEventListener('contextmenu', handleContextMenu, true)
      document.removeEventListener('click', handleClick, true)
      removeFocus()
      if (onUnmounted) { onUnmounted() }
    }
    const handleClick = () => {
      menu.unmount()
      mountEl.remove()
      document.removeEventListener('click', handleClick, true)
      document.removeEventListener('contextmenu', handleContextMenu, true)
      removeFocus()
      if (onUnmounted) { onUnmounted() }
    }
    menu.mount(mountEl)
    document.addEventListener('contextmenu', handleContextMenu, true)
    document.addEventListener('click', handleClick, true)
    if (onMounted) {
      onMounted(menu)
    }
    return {
      withFocus:withFocus
    }
  }

  public static showEqualizerWindow() {
    const container = document.createElement('div')
    return new Promise<string>((resolve, reject) => {
      const app = createApp(Equalizer, {
        onClose: () => {
          app.unmount()
          container.remove()
          reject('canceled')
        }
      })
      document.body.appendChild(container)
      app.mount(container)
    })
  }

  public static showMiniplayerProjectCreator() {
    const container = document.createElement('div')
    return new Promise<string>((resolve, reject) => {
      const app = createApp(CreateDevProject, {
        onClose: () => {
          app.unmount()
          container.remove()
          reject('canceled')
        }
      })
      document.body.appendChild(container)
      app.mount(container)
    })
  }
}
