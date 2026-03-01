type RestArray<I> = I extends any[] ? I : [I]

export class EventEmitter<T extends Record<string | symbol, any[]> = Record<string | symbol, any[]>> {
    private events: Map<keyof T | string | symbol, Function[]> = new Map();
    private static defaultMaxListeners: number = 10;
    private maxListeners: number = EventEmitter.defaultMaxListeners;

    public setMaxListeners(n: number): this {
        this.maxListeners = n;
        return this;
    }

    public getMaxListeners(): number {
        return this.maxListeners;
    }

    public addListener<E extends keyof T>(eventName: E, listener: (...args: T[E]) => void): this;
    public addListener(eventName: string | symbol, listener: (...args: any[]) => void): this;
    public addListener(eventName: any, listener: (...args: any[]) => void): this {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }

        const listeners = this.events.get(eventName)!;
        listeners.push(listener);

        if (listeners.length > this.maxListeners) {
            console.warn(
                `Possible EventEmitter memory leak detected. ${listeners.length} ${String(eventName)} listeners added. Use emitter.setMaxListeners() to increase limit`
            );
        }

        return this;
    }

    public on<E extends keyof T>(eventName: E, listener: (...args: T[E]) => void): this;
    public on(eventName: string | symbol, listener: (...args: any[]) => void): this;
    public on(eventName: any, listener: (...args: any[]) => void): this {
        return this.addListener(eventName, listener);
    }

    public once<E extends keyof T>(eventName: E, listener: (...args: T[E]) => void): this;
    public once(eventName: string | symbol, listener: (...args: any[]) => void): this;
    public once(eventName: any, listener: (...args: any[]) => void): this {
        const onceWrapper: Function = (...args: any[]) => {
            listener(...args);
            this.off(eventName, onceWrapper as any);
        };
        this.addListener(eventName, onceWrapper as any);
        return this;
    }

    public prependListener<E extends keyof T>(eventName: E, listener: (...args: T[E]) => void): this;
    public prependListener(eventName: string | symbol, listener: (...args: any[]) => void): this;
    public prependListener(eventName: any, listener: (...args: any[]) => void): this {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }

        const listeners = this.events.get(eventName)!;
        listeners.unshift(listener);

        if (listeners.length > this.maxListeners) {
            console.warn(
                `Possible EventEmitter memory leak detected. ${listeners.length} ${String(eventName)} listeners added. Use emitter.setMaxListeners() to increase limit`
            );
        }

        return this;
    }

    public prependOnceListener<E extends keyof T>(eventName: E, listener: (...args: T[E]) => void): this;
    public prependOnceListener(eventName: string | symbol, listener: (...args: any[]) => void): this;
    public prependOnceListener(eventName: any, listener: (...args: any[]) => void): this {
        const onceWrapper: Function = (...args: any[]) => {
            listener(...args);
            this.off(eventName, onceWrapper as any);
        };
        this.prependListener(eventName, onceWrapper as any);
        return this;
    }

    public removeListener<E extends keyof T>(eventName: E, listener: (...args: T[E]) => void): this;
    public removeListener(eventName: string | symbol, listener: (...args: any[]) => void): this;
    public removeListener(eventName: any, listener: (...args: any[]) => void): this {
        return this.off(eventName, listener);
    }

    public off<E extends keyof T>(eventName: E, listener: (...args: T[E]) => void): this;
    public off(eventName: string | symbol, listener: (...args: any[]) => void): this;
    public off(eventName: any, listener: (...args: any[]) => void): this {
        if (!this.events.has(eventName)) return this;

        const listeners = this.events.get(eventName)!;
        const filtered = listeners.filter(l => l !== listener);

        if (filtered.length > 0) {
            this.events.set(eventName, filtered);
        } else {
            this.events.delete(eventName);
        }

        return this;
    }

    public removeAllListeners<E extends keyof T>(eventName?: E): this;
    public removeAllListeners(eventName?: string | symbol): this;
    public removeAllListeners(eventName?: any): this {
        if (eventName) {
            this.events.delete(eventName);
        } else {
            this.events.clear();
        }
        return this;
    }

    public emit<E extends keyof T>(eventName: E, ...args: T[E]): boolean;
    public emit(eventName: string | symbol, ...args: any[]): boolean;
    public emit(eventName: any, ...args: any[]): boolean {
        if (!this.events.has(eventName)) return false;

        const listeners = [...this.events.get(eventName)!];
        listeners.forEach(listener => {
            listener(...args);
        });

        return true;
    }

    public eventNames(): (keyof T | string | symbol)[] {
        return Array.from(this.events.keys());
    }

    public listenerCount<E extends keyof T>(eventName: E, listener?: (...args: T[E]) => void): number;
    public listenerCount(eventName: string | symbol, listener?: (...args: any[]) => void): number;
    public listenerCount(eventName: any, listener?: Function): number {
        if (!this.events.has(eventName)) return 0;

        if (listener) {
            return this.events.get(eventName)!.filter(l => l === listener).length;
        }

        return this.events.get(eventName)!.length;
    }

    public listeners<E extends keyof T>(eventName: E): ((...args: T[E]) => void)[];
    public listeners(eventName: string | symbol): ((...args: any[]) => void)[];
    public listeners(eventName: any): Function[] {
        return this.events.has(eventName) ? [...this.events.get(eventName)!] : [];
    }

    public rawListeners<E extends keyof T>(eventName: E): ((...args: T[E]) => void)[];
    public rawListeners(eventName: string | symbol): ((...args: any[]) => void)[];
    public rawListeners(eventName: any): Function[] {
        return this.listeners(eventName);
    }
}

export class EventGroup<Events extends Record<string | symbol, any> = Record<string, any>> extends EventEmitter<Events> {
    public id: string
    private parentStore: Map<keyof Events, RestArray<Events[keyof Events]>>
    constructor(id: string, store: Map<keyof Events, RestArray<Events[keyof Events]>>) {
        super()
        this.id = id
        this.parentStore = store
    }
    public rePostGroupEvents() {
        const events = [...this.parentStore.entries()]
        for (const [key, args] of events) {
            this.emit(key, ...args)
        }
    }
    public post<Key extends keyof Events>(key: Key, ...args: RestArray<Events[Key]>) {
        this.emit(key, ...args)
    }
}

export class BetterEventEmitter<Events extends Record<string | symbol, any> = Record<string, any>, GroupIds extends Array<string> = []> extends EventEmitter<Events> {

    private eventStore = new Map<keyof Events, RestArray<Events[keyof Events]>>();
    private eventGroups = new Map<GroupIds[number], EventGroup<Events>>()
    private maxGroup: number = 10

    constructor() {
        super();
    }

    public setPost<Key extends keyof Events>(key: Key, ...args: RestArray<Events[Key]>): this {
        this.eventStore.set(key, args)
        this.emit(key, ...args)
        this._broadcastGroups(key, ...args)
        return this
    }

    public setPostToGroup<Key extends keyof Events>(groupId: GroupIds[number], key: Key, ...args: RestArray<Events[Key]>): this {
        this.set(key, ...args)
        const group = this.eventGroups.get(groupId)
        if (group) {
            group.emit(key, ...args)
        }
        return this
    }

    public set<Key extends keyof Events>(key: Key, ...args: RestArray<Events[Key]>): this {
        this.eventStore.set(key, args)
        return this
    }

    public get<Key extends keyof Events>(key: Key) { return this.eventStore.get(key) }

    public delete<Key extends keyof Events>(key: Key): this {
        this.eventStore.delete(key)
        return this
    }

    public post<Key extends keyof Events>(key: Key, ...args: RestArray<Events[Key]>) {
        this.emit(key, ...args)
        this._broadcastGroups(key, ...args)
    }

    public postToGroup<Key extends keyof Events>(groupId: GroupIds[number], key: Key, ...args: RestArray<Events[Key]>) {
        const group = this.eventGroups.get(groupId)
        if (group) {
            group.emit(key, ...args)
        }
    }

    public group(groupId: GroupIds[number]): EventGroup<Events> {
        if (this.eventGroups.has(groupId)) {
            return this.eventGroups.get(groupId) as EventGroup<Events>
        }
        else {
            if (this.eventGroups.size > this.maxGroup) {
                console.warn('To many groups!')
            }
            const nxee = new EventGroup<Events>(groupId, this.eventStore)
            this.eventGroups.set(groupId, nxee)
            return nxee
        }
    }

    public setMaxGroup(max: number): Omit<this, 'setMaxGroup'> {
        this.maxGroup = max
        return this
    }

    public removeGroup(groupId: GroupIds[number]): this {
        const group = this.eventGroups.get(groupId)
        if (group) {
            group.removeAllListeners()
            this.eventGroups.delete(groupId)
        }
        return this
    }

    public addGroup(groupId: GroupIds[number]): this {
        if (this.eventGroups.size > this.maxGroup) {
            console.warn('To many groups!')
        }
        if (this.eventGroups.has(groupId)) {
            return this
        }
        const nxee = new EventGroup<Events>(groupId, this.eventStore)
        this.eventGroups.set(groupId, nxee)
        return this
    }

    public rePostAllEvents() {
        const events = [...this.eventStore.entries()]
        for (const [key, args] of events) {
            this._broadcastGroups(key, ...args)
            this.emit(key, ...args)
        }
    }

    private _broadcastGroups<Key extends keyof Events>(key: Key, ...args: RestArray<Events[Key]>) {
        const groups = [...this.eventGroups.values()]
        for (const group of groups) {
            group.emit(key, ...args)
        }
    }
}
