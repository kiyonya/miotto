import { clamp } from "lodash"

export default class FishGame {
    private cvs: HTMLCanvasElement
    private ctx: CanvasRenderingContext2D

    private fishingProgress: number = 0.16
    private isClosed: boolean = false

    private rodRange: number = 0.22
    private rodBottomY: number = 0
    private rodDeltaSensitive: number = 0.003
    private rodTopY: number = this.rodBottomY + this.rodRange
    private rodDeltaY: number = 0
    private isPressing: boolean = false
    private fishTrackWidth = 30
    private gap: number = 15
    private progressBarWidth = 15
    private progressBarHeightPrecentage: number = 0.8

    private fishFreeze: number = 200
    private fishRange: number = 0.05
    private fishBottomY: number = 0
    private fishTopY: number = this.fishBottomY + this.fishRange
    private fishVitality: number = 0.9
    private fishDeltaY: number = 0
    private fishBehavior: 'normal' | 'teasing' | 'sprint' = 'normal'
    private behaviorTimer: number = 0
    private teasingAmplitude: number = 0.003
    private teasingDirection: number = 1
    private sprintSpeed: number = 0.015
    private sprintDirection: number = 1
    private lastPlayerPosition: number = 0
    private isPlayerNearby: boolean = false

    private fishSuccess: (() => void) | null = null;
    private fishFailed: (() => void) | null = null;

    constructor(cvs: HTMLCanvasElement) {
        this.cvs = cvs
        this.ctx = cvs.getContext('2d') as CanvasRenderingContext2D
        this.cvs.width = this.fishTrackWidth + this.gap + this.progressBarWidth
        this.eventListeners()
    }

    private handleKeyDown(e: KeyboardEvent) {
        if (e.key === 'c') {
            this.isPressing = true
        }
    }

    private handleKeyUp(e: KeyboardEvent) {
        if (e.key === 'c') {
            this.isPressing = false
        }
    }

    private eventListeners() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this))
        document.addEventListener('keyup', this.handleKeyUp.bind(this))
    }

    private updateFishBehavior() {
        this.behaviorTimer--
        const playerCenter = this.rodBottomY + this.rodRange / 2
        const fishCenter = this.fishBottomY + this.fishRange / 2
        const distanceToPlayer = Math.abs(playerCenter - fishCenter)
        this.isPlayerNearby = distanceToPlayer < this.rodRange * 1.5

        if (this.behaviorTimer <= 0) {
            const rand = Math.random()
            if (rand < 0.3) {
                this.fishBehavior = 'teasing'
                this.behaviorTimer = 30 + Math.floor(Math.random() * 30)
                this.teasingDirection = Math.random() > 0.5 ? 1 : -1
            } else if (rand < 0.5) {
                this.fishBehavior = 'sprint'
                this.behaviorTimer = 15 + Math.floor(Math.random() * 20)
                if (this.isPlayerNearby) {
                    this.sprintDirection = fishCenter > playerCenter ? 1 : -1
                } else {
                    this.sprintDirection = Math.random() > 0.5 ? 1 : -1
                }
            } else {
                this.fishBehavior = 'normal'
                this.behaviorTimer = 45 + Math.floor(Math.random() * 45)
            }
        }
    }

    private calculateFishMovement(): number {
        const fishCenter = this.fishBottomY + this.fishRange / 2
        let movement = 0

        switch (this.fishBehavior) {
            case 'normal':
                movement = (Math.random() * 0.01 - 0.005)
                if (fishCenter < 0.2) {
                    movement += 0.001
                } else if (fishCenter > 0.8) {
                    movement -= 0.001
                }
                break

            case 'teasing':
                movement = this.teasingAmplitude * this.teasingDirection
                if (Math.random() < 0.1) {
                    this.teasingDirection *= -1
                }
                if (this.isPlayerNearby) {
                    movement *= 1.2
                }
                break

            case 'sprint':
                movement = this.sprintSpeed * this.sprintDirection
                if (fishCenter <= 0.1 && this.sprintDirection < 0) {
                    this.sprintDirection = 1
                } else if (fishCenter >= 0.9 && this.sprintDirection > 0) {
                    this.sprintDirection = -1
                }
                break
        }
        this.lastPlayerPosition = this.rodBottomY + this.rodRange / 2
        return movement
    }

    private tick() {
        if (this.isPressing) {
            this.rodDeltaY = this.rodDeltaSensitive
            if (this.rodTopY < 1) {
                this.rodBottomY += this.rodDeltaY
            }
        }
        else {
            this.rodDeltaY = -this.rodDeltaSensitive
            if (this.rodBottomY > 0) {
                this.rodBottomY += this.rodDeltaY
            }
        }
        this.rodBottomY = clamp(this.rodBottomY, 0, 1 - this.rodRange)
        this.rodTopY = this.rodBottomY + this.rodRange
        this.rodTopY = clamp(this.rodTopY, this.rodRange, 1)

        if (this.fishFreeze === 0 && Math.random() > (1 - this.fishVitality)) {
            this.updateFishBehavior()
            this.fishDeltaY = this.calculateFishMovement()

            if (this.fishTopY <= 1 && this.fishBottomY >= 0) {
                this.fishBottomY += this.fishDeltaY
            }

            this.fishBottomY = clamp(this.fishBottomY, 0, 1 - this.fishRange)
            this.fishTopY = this.fishBottomY + this.fishRange
            this.fishTopY = clamp(this.fishTopY, this.fishRange, 1)

            if (this.fishBottomY <= 0.05) {
                this.fishDeltaY = Math.abs(this.fishDeltaY) * 0.5 + 0.002
            } else if (this.fishTopY >= 0.95) {
                this.fishDeltaY = -(Math.abs(this.fishDeltaY) * 0.5 + 0.002)
            }
        }
        if (this.fishFreeze > 0) { this.fishFreeze-- }

        const isFishInRange = !(this.fishTopY < this.rodBottomY || this.fishBottomY > this.rodTopY)
        if (isFishInRange) {
            this.fishingProgress += 0.001
        } else {
            if (this.fishFreeze === 0) {
                this.fishingProgress -= 0.001
            }

        }
        this.fishingProgress = clamp(this.fishingProgress, 0, 1)

        let status = 0
        if (this.fishingProgress <= 0) { status = -1 }
        else if (this.fishingProgress >= 1) { status = 1 }
        return status
    }

    private mainLoop() {
        if (this.isClosed) return
        const status = this.tick()
        if (status === 1) {
            this.fishSuccess?.()
            this.isClosed = true
            return
        }
        else if (status === -1) {
            this.fishFailed?.()
            this.isClosed = true
            return
        }
        this.drawFishingTrack(this.rodBottomY)
        this.drawFish()
        this.drawProgressBar()
        requestAnimationFrame(() => this.mainLoop())
    }

    public start() {
        this.isClosed = false
        this.fishBottomY = 0.5 - this.fishRange / 2
        this.rodBottomY = 0.5 - this.rodRange / 2
        this.behaviorTimer = 30
        this.mainLoop()
        return new Promise<void>((resolve, reject) => {
            this.fishSuccess = resolve
            this.fishFailed = reject
        })
    }

    public close() {
        this.isClosed = true
    }

    private drawFishingTrack(rodBottomY: number) {
        this.ctx.fillStyle = `red`
        this.ctx.fillRect(0, 0, this.fishTrackWidth, this.cvs.height)
        this.ctx.fillStyle = `blue`
        const rodRangePx = this.rodRange * this.cvs.height
        const rodBottomYPx = (this.cvs.height - rodBottomY * this.cvs.height) - rodRangePx
        this.ctx.fillRect(0, rodBottomYPx, this.fishTrackWidth, rodRangePx)
    }

    private drawFish() {
        this.ctx.fillStyle = `green`
        const fishRangePx = this.fishRange * this.cvs.height
        const fishBottomYPx = (this.cvs.height - this.fishBottomY * this.cvs.height) - fishRangePx
        this.ctx.fillRect(0, fishBottomYPx, this.fishTrackWidth, fishRangePx)
    }

    private drawProgressBar() {
        const barX = this.fishTrackWidth + this.gap
        const barY = (this.cvs.height * (1 - this.progressBarHeightPrecentage)) / 2
        const barWidth = this.progressBarWidth
        const barHeight = this.cvs.height * this.progressBarHeightPrecentage
        this.ctx.fillStyle = `gray`
        this.ctx.fillRect(barX, barY, barWidth, barHeight)

        const progressHeight = barHeight * this.fishingProgress
        this.ctx.fillStyle = `yellow`
        this.ctx.fillRect(barX, barY + (barHeight - progressHeight), barWidth, progressHeight)
    }
}