import { ipcMain } from "electron"
import { windowManager } from "../utils/window"
import { AppEvents } from "../../types/event"

const CONTROL_EVENTS: (keyof AppEvents.Controls)[] = [
    "player::play",
    "player::pause",
    "player::next",
    "player::playPause",
    "player::previous",
    "player::playTrack",
    "player::playTrackList",
    "player::setVolume",
    "player::seek",
    "player::seekProgress",
    "player::mute",
    "player::unmute",
    "player::playMode",
    "player::swtichPlayMode"
]

export function controlIPC() {

    const mainWindow = windowManager.getWindow('main')
    if (mainWindow) {

        for (const ctl of CONTROL_EVENTS) {
            ipcMain.handle(`ctl:${ctl}`, (_, ...args: any[]) => {
                mainWindow.webContents.send(`ctl:${ctl}`, ...args)
            })
        }

    }
}