import { AppEvents } from "./event";

export const PluginAvailableEvents:(keyof AppEvents.PluginAvailableEvents)[] = [
     "audio::canplay",
    "audio::duration",
    "audio::end",
    "audio::mute",
    "audio::pause",
    "audio::play",
    "audio::playstateUpdate",
    "audio::seek",
    "audio::timeUpdate",
    "audio::userRequestPause",
    "audio::userRequestPlay",
    "audio::volumeChange",
    "player::nextSong",
    "player::playSong",
    "player::playlistUpdate",
    "player::playmodeUpdate",
    "player::previousSong",
    "playing::lyricUpdate",
    "playing::songUpdate",
    "playing::trackIdUpdate",
    "playing::trackUpdate",
    "app::themeUpdate",
    "app::renderMount",
    "app::renderReady",
    "audio::byteFrequency"
]

function strictSatisfyControls<T extends readonly any[]>(emits: T & (keyof AppEvents.Controls extends T[number] ? any : never)): T {return emits}

export const PluginAvailableControls  = strictSatisfyControls([
  "player::play",
  "player::pause",
  "player::playPause",
  "player::next",
  "player::previous",
  "player::playTrack",
  "player::playTrackList",
  "player::setVolume",
  "player::seek",
  "player::seekProgress",
  "player::mute",
  "player::unmute",
  "player::playMode",
  "player::swtichPlayMode",
  "audio::getByteFrequency"
] as const)


export const IPCMainRepostControls = strictSatisfyControls([
  "player::play",
  "player::pause",
  "player::playPause",
  "player::next",
  "player::previous",
  "player::playTrack",
  "player::playTrackList",
  "player::setVolume",
  "player::seek",
  "player::seekProgress",
  "player::mute",
  "player::unmute",
  "player::playMode",
  "player::swtichPlayMode",
  "audio::getByteFrequency"
] as const)