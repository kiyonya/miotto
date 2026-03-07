import { optimizer } from "@electron-toolkit/utils";
import { BrowserWindow } from "electron";
import EventEmitter from "events";

export class WindowManager<AvailableIds extends Array<string | number> = Array<string | number>, AvailableGroupIds extends Array<string> = Array<string>> extends EventEmitter {
    private windows = new Map<AvailableIds[number], BrowserWindow>()
    private groups: Record<AvailableGroupIds[number], Set<BrowserWindow>> = {} as any
    constructor() {
        super()
    }

    get mainWindow(){
        return this.windows.get('main')
    }
    
    public createWindow(id: AvailableIds[number], options?: Electron.BaseWindowConstructorOptions & Electron.BrowserViewConstructorOptions, groupId?: AvailableGroupIds[number]): BrowserWindow {
        if (this.windows.has(id)) {
            throw new Error(`Window with id "${id}" already exists`)
        }
        const window = new BrowserWindow(options)
        this.windows.set(id, window)

        if (groupId) {
            if (!this.groups[groupId]) {
                this.groups[groupId] = new Set<BrowserWindow>([window])
            }
            else {
                this.groups[groupId].add(window)
            }
        }

        window.on('closed', () => {
            this.windows.delete(id)
            if (groupId) {
                this.groups[groupId]?.delete(window)
            }
        })

        window.on('show', () => {
            window.webContents.send('win:created', window.webContents.id)
        })

        optimizer.watchWindowShortcuts(window)

        return window
    }

    public getWindow(id: AvailableIds[number]): BrowserWindow | undefined {
        return this.windows.get(id)
    }

    public getGroupWindows(groupId: AvailableGroupIds[number]) {
        return this.groups[groupId] ? Array.from(this.groups[groupId]) : []
    }

    public closeWindow(id: AvailableIds[number]): void {
        const win = this.windows.get(id)
        if (win) {
            win.close()
        }
    }

    public closeAllWindows(): void {
        this.windows.forEach(win => win.close())
        this.windows.clear()
    }

    public getAllWindows(): IterableIterator<BrowserWindow> {
        return this.windows.values()
    }

    public hasWindow(id: AvailableIds[number]): boolean {
        return this.windows.has(id)
    }

    public minimizeWindow(id: AvailableIds[number]): void {
        const win = this.windows.get(id)
        if (win && !win.isMinimized()) {
            win.minimize()
        }
    }

    public maximizeWindow(id: AvailableIds[number]): void {
        const win = this.windows.get(id)
        if (win && !win.isMaximized()) {
            win.maximize()
        }
    }

    public restoreWindow(id: AvailableIds[number]): void {
        const win = this.windows.get(id)
        if (win && win.isMinimized()) {
            win.restore()
        }
    }

    public hideWindow(id: AvailableIds[number]): void {
        const win = this.windows.get(id)
        if (win && !win.isDestroyed()) {
            win.hide()
        }
    }

    public showWindow(id: AvailableIds[number]): void {
        const win = this.windows.get(id)
        if (win && !win.isDestroyed()) {
            win.show()
        }
    }

    public focusWindow(id: AvailableIds[number]): void {
        const win = this.windows.get(id)
        if (win && !win.isDestroyed()) {
            win.focus()
        }
    }

    public getWindowCount(): number {
        return this.windows.size
    }

    public getWindowIds(): AvailableIds[number][] {
        return Array.from(this.windows.keys())
    }

    public executeOnWindow<T>(id: AvailableIds[number], callback: (window: BrowserWindow) => T): T | undefined {
        const win = this.windows.get(id)
        if (win && !win.isDestroyed()) {
            return callback(win)
        }
        return undefined
    }
}

type WindowId = Array<string | number>
const windowManager = new WindowManager<WindowId, ['plugin']>()
export { windowManager }