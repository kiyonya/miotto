interface TimelineWord {
    startTime: number,
    duration: number,
    char: string
}
interface ParsedLyricLine {
    isTimeline: boolean,
    string: string,
    words: TimelineWord[] | null,
    lineStartTime: number,
    lineDuration: number
}
interface TimelineLyricLine {
    isTimeline: true,
    words: TimelineWord[],
    string: string
}
interface NormalLyricLine {
    isTimeline: false,
    string: string,
    words: null
}
interface BaseLine {
    effect?: {
        align?: 'left' | 'center' | 'right',
        color?: string,
        bold?: boolean,
        italic?: boolean,
    }
}
interface LyricLine extends BaseLine {
    type: 'lyric'
    lineStartTime: number,
    lineDuration: number,
    mainLyric: TimelineLyricLine | NormalLyricLine,
    translateLyric: TimelineLyricLine | NormalLyricLine | null,
    romaLyric: TimelineLyricLine | NormalLyricLine | null,
}
interface GapLine extends BaseLine {
    type: 'gap'
    lineStartTime: number,
    lineDuration: number,
}
interface SubLyricLine extends BaseLine {
    type: 'sublyric'
    lineStartTime: number,
    lineDuration: number,
    mainLyric: TimelineLyricLine | NormalLyricLine,
    translateLyric: TimelineLyricLine | NormalLyricLine | null,
    romaLyric: TimelineLyricLine | NormalLyricLine | null,
}
type CombineLine = LyricLine | GapLine | SubLyricLine

export function parse(lyric: string): ParsedLyricLine[] {
    if (!lyric) {
        return []
    }
    const lyrics = (lyric.split('\n').filter(i => i.startsWith('[')))
    const parsedLyric: ParsedLyricLine[] = []

    for (const line of lyrics) {
        if (/^\[\d+,\d+\](\(\d+,\d+,0\)[^\(\)\[\]]+)+$/.test(line)) {

            const lineMatch = line.match(/\[(\d+),(\d+)\]|\((\d+),(\d+),0\)([^\(\)\[\]]+)/g)
            if (!lineMatch) {
                continue
            }
            const lineMeta = lineMatch.shift()
            if (!lineMeta) {
                continue
            }
            const lineMetaMatch = lineMeta.match(/\[(\d+),(\d+)\]/)
            const lineStartTime = Number(lineMetaMatch?.[1]) || 0
            const lineDuration = Number(lineMetaMatch?.[2]) || 0

            const words: TimelineWord[] = []

            for (const word of lineMatch) {
                const wordMatch = word.match(/\((\d+),(\d+),0\)(.+)/);
                const startTime = Number(wordMatch?.[1]) || 0
                const durationCs = Number(wordMatch?.[2]) || 0
                const character = wordMatch?.[3] || ''
                const duration = + durationCs * 1

                words.push({
                    startTime: startTime,
                    duration: duration,
                    char: character
                })
            }
            const parsedLine: ParsedLyricLine = {
                isTimeline: true,
                words: words,
                lineStartTime: lineStartTime,
                lineDuration: lineDuration,
                string: words.map(i => i.char).join('')
            }
            parsedLyric.push(parsedLine)
        }

        else if (/^\[\d{2}:\d{2}\.\d{2,3}\].+$/.test(line)) {
            const lineMatch = line.match(/^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)$/)
            const m = Number(lineMatch?.[1])
            const s = Number(lineMatch?.[2])
            const ms = Number(lineMatch?.[3])
            const lineStartTime = +m * 60 * 1000 + s * 1000 + ms
            const parsedLine = {
                isTimeline: false,
                words: null,
                lineStartTime: lineStartTime,
                lineDuration: -1,
                string: lineMatch?.[4] || ''
            }
            parsedLyric.push(parsedLine)
        }
        else if (/^\[(\d{2}):(\d{2}):(\d{2})\](.*)$/.test(line)) {
            const lineMatch = line.match(/^\[(\d{2}):(\d{2}):(\d{2})\](.*)$/)
            const m = Number(lineMatch?.[1])
            const s = Number(lineMatch?.[2])
            const cs = Number(lineMatch?.[3])
            const lineStartTime = m * 60000 + s * 1000 + cs * 10;
            const parsedLine = {
                isTimeline: false,
                words: null,
                lineStartTime: lineStartTime,
                lineDuration: -1,
                string: lineMatch?.[4] || ''
            }
            parsedLyric.push(parsedLine)
        }

    }
    return parsedLyric
}
export function combinor(mainLyric: ParsedLyricLine[], translateLyric?: ParsedLyricLine[], romaLyric?: ParsedLyricLine[]): CombineLine[] {
    const lyricCombineResult: CombineLine[] = []
    const translateLyricKV: Record<number, ParsedLyricLine> = {}
    if (translateLyric) {
        for (const tlyric of translateLyric) {
            translateLyricKV[tlyric.lineStartTime] = tlyric
        }
    }
    const romaLyricKV: Record<number, ParsedLyricLine> = {}
    if (romaLyric) {
        for (const rlyric of romaLyric) {
            romaLyricKV[rlyric.lineStartTime] = rlyric
        }
    }
    for (const lyric of mainLyric) {
        const itime = lyric.lineStartTime
        const tlyric = translateLyricKV[itime]
        const rlyric = romaLyricKV[itime]
        const isSubLyric: boolean = /\(.*\)|（.*）|【.*】|\[.*\]/.test(lyric.string)
        const combineLine: LyricLine | SubLyricLine = {
            lineDuration: lyric.lineDuration,
            lineStartTime: lyric.lineStartTime,
            mainLyric: _ipar2cbl(lyric),
            translateLyric: tlyric ? _ipar2cbl(tlyric) : null,
            romaLyric: rlyric ? _ipar2cbl(rlyric) : null,
            type: isSubLyric ? 'sublyric' : 'lyric'
        }
        lyricCombineResult.push(combineLine)
    }
    for (let i = 0; i < lyricCombineResult.length - 1; i++) {
        const now = lyricCombineResult[i]
        const next = lyricCombineResult[i + 1]
        if (now.lineDuration < 0) {
            now.lineDuration = next.lineStartTime - now.lineStartTime
        }
        const endtime = now.lineStartTime + now.lineDuration
        const lineGapTime = next.lineStartTime - endtime
        if (lineGapTime > 5000) {
            const gapLine: GapLine = {
                type: 'gap',
                lineStartTime: endtime,
                lineDuration: lineGapTime,
            }
            lyricCombineResult.splice(i + 1, 0, gapLine)
        }
    }
    return lyricCombineResult
}
function _ipar2cbl(lyric: ParsedLyricLine) {
    let line: TimelineLyricLine | NormalLyricLine
    if (lyric.isTimeline) {
        const mainLyricAsTimelineType: TimelineLyricLine = {
            isTimeline: true,
            string: lyric.string,
            words: lyric.words as TimelineWord[]
        }
        line = mainLyricAsTimelineType
    }
    else {
        const mainLyricAsNormalType: NormalLyricLine = {
            isTimeline: false,
            string: lyric.string,
            words: null
        }
        line = mainLyricAsNormalType
    }
    return line
}