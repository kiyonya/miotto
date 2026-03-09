import { AppTypes } from "src/types/app";

interface TimeState {
    line: AppTypes.MLyric.CombineLine,
    lineIndex: number,
    wordIndex?: number,
    gapProgress?: number
}

export function computeHighlightV2(lyric: AppTypes.MLyric.CombineLine[], timems: number): TimeState {
    const highlightLineIndex = computeHltLineIndex(lyric, timems)
    const thisLine = lyric[highlightLineIndex]
    if(!thisLine){
        return {
            line: thisLine,
            lineIndex: -1,
        }
    }
    if (thisLine.type === 'gap') {
        const gapStart = thisLine.lineStartTime
        const gapPass = (timems - gapStart) / thisLine.lineDuration
        return {
            line: thisLine,
            lineIndex: highlightLineIndex,
            gapProgress: gapPass
        }
    }
    else if (thisLine.type === 'lyric' || thisLine.type === 'sublyric') {
        const isTimelineLyric = thisLine.mainLyric.isTimeline
        if (isTimelineLyric) {
            const words = thisLine.mainLyric.words
            const thisWordIndex = computeHltWordIndex(words, timems)
            return {
                line: thisLine,
                lineIndex: highlightLineIndex,
                wordIndex: thisWordIndex
            }
        }
        else {
            return {
                line: thisLine,
                lineIndex: highlightLineIndex
            }
        }
    }
    else {
        throw new Error('')
    }
}

export function computeHltLineIndex(lyric: AppTypes.MLyric.CombineLine[], timems: number): number {
    let left = 0;
    let right = lyric.length - 1;
    let result = -1;
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const line = lyric[mid];
        const lineEndTime = line.lineStartTime + line.lineDuration;
        if (timems >= line.lineStartTime && timems <= lineEndTime) {
            return mid;
        } else if (timems < line.lineStartTime) {
            right = mid - 1;
        } else {
            left = mid + 1;
            result = mid;
        }
    }
    return result;
}

export function computeHltWordIndex(words: AppTypes.MLyric.TimelineWord[], timems: number): number {
    if (!words || words.length === 0) return -1;
    if (timems < words[0].startTime) {
        return -1;
    }
    const lastWord = words[words.length - 1];
    if (timems >= lastWord.startTime + lastWord.duration) {
        return words.length - 1;
    }

    let left = 0;
    let right = words.length - 1;
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const word = words[mid];
        const wordEndTime = word.startTime + word.duration;

        if (timems >= word.startTime && timems < wordEndTime) {
            return mid;
        } else if (timems < word.startTime) {
            right = mid - 1;
        } else {
            left = mid + 1;
        }
    }
    return Math.max(0, right);
}