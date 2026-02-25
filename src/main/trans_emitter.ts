import EventEmitter from "events";
import { AppTypes } from "../types/app";

class DataTransEmitter<DataMap extends Record<string, any> = {}> extends EventEmitter {
    public dataStore = new Map<keyof DataMap, DataMap[keyof DataMap]>()
    constructor() {
        super()
    }

    public set<K extends keyof DataMap>(key: K, value: DataMap[K], emit: boolean = true): void {
        this.dataStore.set(key, value)
        if (emit) {
            this.emit(key, value)
            this.emit('event', key, value)
        }
    }

    public get<K extends keyof DataMap>(key: K): DataMap[K] | undefined {
        return this.dataStore.get(key) as DataMap[K] | undefined
    }

    public update<K extends keyof DataMap>(key: K, partialValue: Partial<DataMap[K]>, emit: boolean = true): void {
        const currentValue = this.dataStore.get(key) as DataMap[K] || {} as DataMap[K]
        const newValue = { ...currentValue, ...partialValue }
        this.dataStore.set(key, newValue)
        if (emit) {
            this.emit(key as string, newValue)
            this.emit('event', key, newValue)
        }
    }

    public delete<K extends keyof DataMap>(key: K): void {
        this.dataStore.delete(key)
    }

    public toEmit<K extends keyof DataMap>(key: K, value: DataMap[K]) {
        this.emit(key, value)
        this.emit('event', key, value)
    }

    public emitAll<K extends keyof DataMap>() {
        for (const key of this.dataStore.keys()) {
            this.emit(key, this.dataStore.get(key) as DataMap[K])
        }
    }



    on<K extends keyof DataMap>(event: K, listener: (value: DataMap[K]) => void): this
    on(event: string | symbol, listener: (...args: any[]) => void): this
    on<K extends keyof DataMap>(event: 'event', listener:(key: K, value: DataMap[K])=>void): this
    on(event: string | symbol | keyof DataMap, listener: (...args: any[]) => void): this {
        return super.on(event as string | symbol, listener)
    }
    

    once<K extends keyof DataMap>(event: K, listener: (value: DataMap[K]) => void): this
    once(event: string | symbol, listener: (...args: any[]) => void): this
    once<K extends keyof DataMap>(event: 'event', listener:(key: K, value: DataMap[K])=>void): this
    once(event: string | symbol | keyof DataMap, listener: (...args: any[]) => void): this {
        return super.once(event as string | symbol, listener)
    }

    off<K extends keyof DataMap>(event: K, listener: (value: DataMap[K]) => void): this
    off(event: string | symbol, listener: (...args: any[]) => void): this
    off<K extends keyof DataMap>(event: 'event', listener:(key: K, value: DataMap[K])=>void): this
    off(event: string | symbol | keyof DataMap, listener: (...args: any[]) => void): this {
        return super.off(event as string | symbol, listener)
    }

    emit<K extends keyof DataMap>(event: K, value: DataMap[K]): boolean
    emit(event: string | symbol, ...args: any[]): boolean
    emit<K extends keyof DataMap>(event: 'event', key: K, value: DataMap[K]): boolean
    emit(event: string | symbol | keyof DataMap, ...args: any[]): boolean {
        return super.emit(event as string | symbol, ...args)
    }
}

export const defaultDataTransEmitter = new DataTransEmitter<AppTypes.DefaultTransData>()


export function createTransEmitter<T extends Record<string, any>>() {
    return new DataTransEmitter<T>
}


