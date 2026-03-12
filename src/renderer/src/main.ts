import './assets/main.css'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { App, createApp, Directive, DirectiveBinding } from 'vue'
import RootApp from './App.vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { router } from './router'
import { useProfileStore } from './store/profile'
import FunctionalWindows from './components/windows'
import WAudio from './lib/waudio'

import { Player } from './lib/player'
import { setupKeyListener } from './script/keytap'
import { addRemoteControlHandler } from './script/remote'
import useConfigStore from './store/config'

const globalProperties = {
    install(app: App) {
        app.config.globalProperties.$imgrsz = (url: string, r: number): string => {
            if (/https:\/\/.*\.music\.126\.net\/.*\.jpg/.test(url)) {
                return url + `?param=${r}y${r}&webp=true`
            }
            return url
        }
        app.config.globalProperties.$fmtsecond = (second: number): string => {
            const minute = Math.floor(second / 60)
            const s = Math.floor(second - minute * 60)
            return `${minute.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        }
        app.config.globalProperties.$fmtms = (ms: number): string => {
            const second = ms / 1000
            const minute = Math.floor(second / 60)
            const s = Math.floor(second - minute * 60)
            return `${minute.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        }
        app.config.globalProperties.$fmttimestamp2date = (mst: number): string => {
            const date = new Date(mst)
            const y = (date.getFullYear()).toString().padStart(4, '0')
            const m = (date.getMonth() + 1).toString().padStart(2, '0')
            const d = (date.getDate()).toString().padStart(2, '0')
            return `${y}年${m}月${d}日`
        }
        app.config.globalProperties.$fmtbr = (bitrate: number): string => {
            if (bitrate >= 1000000) {
                let np = Math.floor(bitrate / 1000000)
                return np + 'mbps'
            }
            else if (bitrate > 1000) {
                let np = Math.floor(bitrate / 1000)
                return np + 'kbps'
            }
            else {
                let np = Math.floor(bitrate)
                return np + 'bps'
            }
        }
        app.config.globalProperties.$cmpScrollCenterDistance = (item: HTMLElement, container: HTMLElement) => {
            const itemOffsetTop: number = item?.offsetTop || 0
            const itemHeight: number = item.clientHeight
            const containerHeight: number = container.clientHeight
            const d = itemOffsetTop - (containerHeight / 2) + (itemHeight / 2)
            return Math.max(0, Math.min(d, container.scrollHeight))
        }
    }
}

async function startApp() {

    const app = createApp(RootApp)
    const pinia = createPinia()
    pinia.use(piniaPluginPersistedstate)
    app.use(pinia)
    app.use(router)
    app.use(globalProperties)
    app.use(ElementPlus)

    const lazyLoadObserver = new IntersectionObserver((entries) => {
        for (const enter of entries) {
            if (enter.isIntersecting) {
                const target = enter.target as HTMLImageElement
                if (target.classList.contains('._vlazy')) {
                    const src = target.dataset.src as string
                    target.src = src
                    target.style.opacity = "1"
                    target.classList.remove('._vlazy')
                    lazyLoadObserver.unobserve(target)
                }
            }
        }
    })

    const vImgLazy: Directive = {
        mounted: (el: HTMLImageElement, binding: DirectiveBinding<string>) => {
            const value = binding.value
            if (value) {
                el.style.transition = '0.15s'
                el.style.opacity = '0'
                el.dataset.src = value
                el.classList.add('._vlazy')
                lazyLoadObserver.observe(el)
            }
        },
        unmounted: (el: HTMLImageElement) => {
            lazyLoadObserver.unobserve(el)
        }
    }
    app.directive('imglazy', vImgLazy)

    const waudio = new WAudio()
    const player = new Player(waudio)
    app.config.globalProperties.$player = player
    window.$player = player
    //@ts-ignore
    window.$config = useConfigStore().config
    setupKeyListener()
    addRemoteControlHandler()
    window.emitter.post('app::renderMount', null)
    app.mount('#app')
    window.emitter.post('app::renderMount', null)

    const profileStore = useProfileStore()

    window.ncmapi.loginStatusCheck().then(loginStatus => {
        const profile = loginStatus.data.profile
        const account = loginStatus.data.account
        if (profile && !account.anonimousUser) {
            profileStore.setLoginStatus(true)
            profileStore.setUserProfile(profile)
            if (account) {
                profileStore.setUserAccount(account)
            }
        }
        else {
            profileStore.setLoginStatus(false)
            profileStore.setUserProfile(null)
            profileStore.setUserAccount(null)
            FunctionalWindows.showLoginWindow()
        }


    })
}

startApp()