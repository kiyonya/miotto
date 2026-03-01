
import { AppEvents } from "../../types/event";
import { BetterEventEmitter } from "./bee";

type GroupIds = 'osc' | 'main' | (string & {})
const defaultDataEmitter = new BetterEventEmitter<AppEvents.Events, GroupIds[]>()
defaultDataEmitter.setMaxGroup(20)

export { defaultDataEmitter }
