import { ref, nextTick, Ref } from 'vue'
import type { AppTypes } from 'src/types/app'

export interface IChunk {
    ids: AppTypes.ITrackId[]
    data: (AppTypes.ISong | null)[]
    index: number
    height: number
    start: number
    isLoaded: boolean
    loadMode: 'unload' | 'weak' | 'force'
    el?: HTMLElement | null,
    fitHeight: boolean
}

export interface PlaylistLoaderOptions {
    batchSize?: number
    itemHeight?: number
    preloadRange?: number
    forceLoadRange?: number
    threshold?: number | number[]
    debounceDelay?: number
}

export default class PlaylistLoader {

    public chunks: Ref<IChunk[]>
    public loading = ref(false)
    public totalItems = 0

    private trackIds: AppTypes.ITrackId[] = []
    private options: Required<PlaylistLoaderOptions>
    private loadOb: IntersectionObserver | null = null
    private loadTimeout: NodeJS.Timeout | null = null
    private isDestroyed = false
    public placeholderIndex:number | null = null

    private loadStats = {
        totalChunks: 0,
        loadedChunks: 0,
        totalRequests: 0,
        failedRequests: 0
    }

    constructor(
        trackIds: AppTypes.ITrackId[],
        options: PlaylistLoaderOptions = {}
    ) {
        this.trackIds = [...trackIds]
        this.totalItems = trackIds.length
        this.options = {
            batchSize: 30,
            itemHeight: 3.5,
            preloadRange: 2,
            forceLoadRange: 1,
            threshold: 0.1,
            debounceDelay: 50,
            ...options
        }
        this.chunks = ref<IChunk[]>([])
        this.loading = ref(false)
    }

    public async init(): Promise<Ref<IChunk[]>> {
        if (this.isDestroyed) {
            throw new Error('PlaylistLoader has been destroyed')
        }
        if (this.chunks.value.length > 0) {
            this.chunks.value = []
        }
        await this.initializeChunks()
        await this.setupIntersectionObserver()
        return this.chunks
    }

    private async initializeChunks(): Promise<void> {
        const { batchSize, itemHeight } = this.options
        let chunkIndex = 0
        for (let i = 0; i < this.trackIds.length; i += batchSize) {
            const ids = this.trackIds.slice(i, i + batchSize)

            this.chunks.value.push({
                index: chunkIndex,
                data: new Array(ids.length).fill(null),
                ids: ids,
                loadMode: 'unload',
                isLoaded: false,
                height: itemHeight * ids.length,
                start: i,
                el: null,
                fitHeight: false
            })

            chunkIndex++
        }
        this.loadStats.totalChunks = this.chunks.value.length
        await nextTick()
    }

    private async setupIntersectionObserver(): Promise<void> {
        if (this.loadOb) {
            this.loadOb.disconnect()
        }

        this.loadOb = new IntersectionObserver(
            (entries) => this.handleIntersection(entries),
            {
                threshold: this.options.threshold,
                rootMargin: '50px'
            }
        )

        await nextTick()

        this.chunks.value.forEach(chunk => {
            if (chunk.el) {
                this.loadOb!.observe(chunk.el)
            }
        })

        // 初始加载第一屏
        await this.loadInitialChunks()
    }

    private handleIntersection(entries: IntersectionObserverEntry[]): void {
        if (this.loading.value || this.isDestroyed) return

        for (const entry of entries) {
            if (entry.isIntersecting) {
                this.scheduleChunkLoad(entry)
                break
            }
        }
    }

    private scheduleChunkLoad(entry: IntersectionObserverEntry): void {
        if (this.loadTimeout) {
            clearTimeout(this.loadTimeout)
        }

        this.loadTimeout = setTimeout(() => {
            this.loadVisibleChunks(entry)
        }, this.options.debounceDelay)
    }

    private async loadVisibleChunks(entry: IntersectionObserverEntry): Promise<void> {
        const target = entry.target as HTMLElement
        const currentIndex = Number(target.dataset.index)
        this.updateChunkLoadModes(currentIndex)
        const needLoadChunks = this.getChunksToLoad()
        if (needLoadChunks.length === 0) return
        await this.loadChunks(needLoadChunks)
    }

    private updateChunkLoadModes(currentIndex: number): void {
        const { preloadRange, forceLoadRange } = this.options
        const totalChunks = this.chunks.value.length

        this.chunks.value.forEach(chunk => {
            chunk.loadMode = 'unload'
        })

        for (let i = -preloadRange; i <= preloadRange; i++) {
            const targetIndex = currentIndex + i

            if (targetIndex >= 0 && targetIndex < totalChunks) {
                if (Math.abs(i) <= forceLoadRange) {
                    this.chunks.value[targetIndex].loadMode = 'force'
                } else {
                    this.chunks.value[targetIndex].loadMode = 'weak'
                }
            }
        }
    }

    private getChunksToLoad(): IChunk[] {
        return this.chunks.value.filter(chunk =>
        (chunk.loadMode === 'force' ||
            (chunk.loadMode === 'weak' && !chunk.isLoaded))
        )
    }

    private async loadChunks(chunks: IChunk[]): Promise<void> {
        this.loading.value = true
        this.loadStats.totalRequests++

        try {
            const promises = chunks.map(chunk =>
                this.loadSingleChunk(chunk)
            )

            await Promise.all(promises)

            this.loadStats.loadedChunks += chunks.filter(c => c.isLoaded).length
        } catch (error) {
            this.loadStats.failedRequests++
        } finally {
            this.loading.value = false
        }
    }

    private async loadSingleChunk(chunk: IChunk): Promise<void> {
        if (chunk.isLoaded || this.isDestroyed) return

        try {
            const songs = await this.loadSongs(chunk.ids)
            chunk.data = songs
            chunk.isLoaded = true
        } catch (error) {
        }
    }

    private async loadInitialChunks(): Promise<void> {
        const initialChunks = this.chunks.value.slice(0, 3)

        if (initialChunks.length > 0) {
            await this.loadChunks(initialChunks)
        }
    }

    private async loadSongs(ids: AppTypes.ITrackId[]): Promise<AppTypes.ISong[]> {
        const qsid = ids.map(i => Number(i.id))
        return await window.ncmapi.songDetail(qsid, true)
    }

    public async loadRange(start: number, end: number): Promise<void> {
        if (this.isDestroyed) return

        const chunksToLoad = this.chunks.value
            .filter(chunk => chunk.start >= start && chunk.start < end)
            .filter(chunk => !chunk.isLoaded)

        if (chunksToLoad.length > 0) {
            await this.loadChunks(chunksToLoad)
        }
    }

    public async preloadChunk(chunkIndex: number): Promise<void> {
        if (this.isDestroyed ||
            chunkIndex < 0 ||
            chunkIndex >= this.chunks.value.length) {
            return
        }

        const chunk = this.chunks.value[chunkIndex]
        if (!chunk.isLoaded) {
            await this.loadSingleChunk(chunk)
        }
    }

    public getLoadedCount(): number {
        return this.chunks.value.reduce((count, chunk) =>
            count + (chunk.isLoaded ? chunk.data.length : 0), 0
        )
    }

    public getSongAtIndex(index: number): AppTypes.ISong | 'placeholder' | null {
        for (const chunk of this.chunks.value) {
            if (chunk.isLoaded &&
                index >= chunk.start &&
                index < chunk.start + chunk.ids.length) {
                return chunk.data[index - chunk.start] || null
            }
        }
        return null
    }

    public updateChunkElement(chunkIndex: number, element: HTMLElement): void {
        if (chunkIndex >= 0 && chunkIndex < this.chunks.value.length) {
            const chunk = this.chunks.value[chunkIndex]
            chunk.el = element

            if (this.loadOb && element) {
                this.loadOb.observe(element)
            }
        }
    }

    public getStats(): typeof this.loadStats {
        return { ...this.loadStats }
    }

    public destroy(): void {
        this.isDestroyed = true

        if (this.loadTimeout) {
            clearTimeout(this.loadTimeout)
            this.loadTimeout = null
        }

        if (this.loadOb) {
            this.loadOb.disconnect()
            this.loadOb = null
        }

        this.chunks.value = []
        this.loading.value = false
    }

    public async reset(newTrackIds?: AppTypes.ITrackId[]): Promise<Ref<IChunk[]>> {
        this.destroy()
        this.isDestroyed = false

        if (newTrackIds) {
            this.trackIds = [...newTrackIds]
            this.totalItems = newTrackIds.length
        }

        this.loadStats = {
            totalChunks: 0,
            loadedChunks: 0,
            totalRequests: 0,
            failedRequests: 0
        }

        return await this.init()
    }

    public moveItem(from:number,to:number){
        const sameChunk = this.isInSameChunk(from,to)
        if(sameChunk){
            this.inChunkMovement(from,to)
        }
    }

    private isInSameChunk(index1:number,index2:number){
        const index1ChunkIndex = Math.floor(index1 / this.options.batchSize)
        const index2ChunlIndex = Math.floor(index2 / this.options.batchSize)
        return index1ChunkIndex === index2ChunlIndex
    }

    private inChunkMovement(from:number,to:number){
        const chunkIndex = Math.floor(from / this.options.batchSize)
        const cFrom = from - chunkIndex * this.options.batchSize
        const cTo = to - chunkIndex * this.options.batchSize
        const item = this.chunks.value[chunkIndex].data.splice(cFrom,1)[0]
        this.chunks.value[chunkIndex].data.splice(cTo,0,item)
    }

}
