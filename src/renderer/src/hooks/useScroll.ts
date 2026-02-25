
export function scrollCenterDistance(item: HTMLElement, container: HTMLElement) {
    const itemOffsetTop: number = item?.offsetTop || 0
    const itemHeight: number = item.clientHeight
    const containerHeight: number = container.clientHeight
    const d = itemOffsetTop - (containerHeight / 2) + (itemHeight / 2)
    return Math.max(0, Math.min(d, container.scrollHeight))
}