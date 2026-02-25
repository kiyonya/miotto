import { AppTypes } from "src/types/app";
import { ref, computed, nextTick, toRef } from "vue";

export interface IChunk {
    refs: number[]
    render: boolean
    index: number
    height: number
}
export interface RenderOptions {
    renderChunkSize?: number,
    batchSize?: number,
    debonaceTime?: number,
    observerElementClassName?: string,
    itemHeightInRem?: number
}

export default function usePlaylistRender(length:number, options?: RenderOptions) {

    const trackLength = ref<number>(length)
    const renderChunkSize = options?.renderChunkSize ?? 50
    const itemHeight = options?.itemHeightInRem ?? 3.5
    const debonaceTime = options?.debonaceTime ?? 200
    const observerElementClassName = options?.observerElementClassName ?? '.chunk'
    const renderChunkIndex = ref<number | null>(null)
    const forceLoadChunkIndex = ref<number | null>(null)
    const renderChunks = computed<IChunk[]>(() => {
        const chunks: IChunk[] = []
        let chunkIndex = 0
        for (let i = 0; i < trackLength.value; i += renderChunkSize) {
            const refs: number[] = []
            for (let r = i; r < Math.min(i + renderChunkSize, trackLength.value); r++) {
                refs.push(r)
            }
            let isRender = false
            if (renderChunkIndex.value !== null) {
                isRender = chunkIndex === renderChunkIndex.value ||
                    chunkIndex === renderChunkIndex.value - 1 ||
                    chunkIndex === renderChunkIndex.value + 1
            }
            if(chunkIndex === forceLoadChunkIndex.value){
                isRender = true
            }
            chunks.push({
                refs: refs,
                render: isRender,
                index: chunkIndex,
                height: refs.length * itemHeight,
            })
            chunkIndex++
        }

        return chunks
    })

    let loadIntersectionTimeout: NodeJS.Timeout | null = null
    let loadIntersectionObserver: IntersectionObserver | null = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                if (loadIntersectionTimeout) {
                    clearTimeout(loadIntersectionTimeout)
                }
                loadIntersectionTimeout = setTimeout(() => {
                    const target = entry.target as HTMLElement
                    const dataset = target.dataset
                    const index = Number(dataset.index)
                    renderChunkIndex.value = index
                    forceLoadChunkIndex.value = null
                }, debonaceTime)
            }
        }
    })

    const stop = () => {
        if (loadIntersectionTimeout) {
            clearTimeout(loadIntersectionTimeout)
        }
        loadIntersectionObserver?.disconnect()
        loadIntersectionObserver = null
    }

    let _trackContainer: HTMLElement | null = null

    const start = async (trackContainer: HTMLElement) => {
        await nextTick()
        _trackContainer = trackContainer
        if (trackContainer) {
            const chunks = Array.from(trackContainer.querySelectorAll(observerElementClassName))
            for (const chunk of chunks) {
                loadIntersectionObserver?.observe(chunk)
            }
        }
    }

    const resetTrackIds = () => {
        trackLength.value = 0
        renderChunkIndex.value = 0
    }

    const forceLoadItem = (index:number)=>{
        const chunkIndex = Math.floor(index / renderChunkSize)
        forceLoadChunkIndex.value = chunkIndex
    }

    const updateTrackLength = (length:number)=>{
        trackLength.value = length
    }


    const trackIds = toRef(trackLength)
    return {
        renderChunks,
        updateTrackLength,
        stop,
        start,
        resetTrackIds,
        forceLoadItem,
        trackIds
    }
}