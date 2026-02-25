let lastColorSave: number[][] = []

interface ICircle {
    x: number,
    y: number,
    dx: number,
    dy: number,
    r: number,
    color: [number, number, number, number]
}

export default class DynamicBackgroundWebGL {
    private cvs: HTMLCanvasElement
    private gl: WebGL2RenderingContext | WebGLRenderingContext
    private program: WebGLProgram | null = null
    private animationId: number | null = null
    private lastFrameTime: number
    private candraw: boolean = true
    private exit: boolean = false
    private circles: ICircle[] = []
    private circleCount: number = 0
    
    // WebGL buffers
    private positionBuffer: WebGLBuffer | null = null
    private colorBuffer: WebGLBuffer | null = null
    private sizeBuffer: WebGLBuffer | null = null
    
    // Uniform locations
    private resolutionUniform: WebGLUniformLocation | null = null
    
    // Circle data arrays
    private positions: Float32Array = new Float32Array(0)
    private colors: Float32Array = new Float32Array(0)
    private sizes: Float32Array = new Float32Array(0)
    
    // 存储生成的颜色（RGB 0-255格式）
    private generatedColors: number[][] = []

    constructor(canvas: HTMLCanvasElement) {
        this.cvs = canvas;
        this.cvs.width = window.innerWidth * devicePixelRatio;
        this.cvs.height = window.innerHeight * devicePixelRatio;
        
        // 尝试获取WebGL2上下文，失败则回退到WebGL1
        const gl = this.cvs.getContext('webgl2') || 
                  this.cvs.getContext('webgl') as WebGLRenderingContext;
        
        if (!gl) {
            throw new Error('WebGL not supported');
        }
        
        this.gl = gl;
        this.circles = [];
        this.circleCount = 0;
        this.animationId = null;
        this.lastFrameTime = 0;
        this.candraw = false;
        this.exit = false;
        this.generatedColors = lastColorSave || [];
        
        window.addEventListener('resize', this.resize.bind(this));
        
        this.initWebGL();
    }
    
    private initWebGL(): void {
        const gl = this.gl;
        
        // 顶点着色器
        const vertexShaderSource = `
            attribute vec2 a_position;
            attribute vec4 a_color;
            attribute float a_size;
        
            uniform vec2 u_resolution;
            varying vec4 v_color;
            
            void main() {
                vec2 zeroToOne = a_position / u_resolution;
                vec2 zeroToTwo = zeroToOne * 2.0;
                vec2 clipSpace = zeroToTwo - 1.0;
                clipSpace.y = -clipSpace.y;
                gl_PointSize = a_size * 2.0;
                gl_Position = vec4(clipSpace, 0.0, 1.0);
                v_color = a_color;
            }
        `;
        
        // 片元着色器
        const fragmentShaderSource = `
            precision mediump float;
varying vec4 v_color;

void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
                float dist = length(coord);
                
                if (dist > 0.5) {
                    discard;
                }
                gl_FragColor = vec4(v_color.rgb, v_color.a);
}
        `;
        
        // 编译着色器
        const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
        
        // 创建着色器程序
        this.program = gl.createProgram();
        if (!this.program) {
            throw new Error('Failed to create WebGL program');
        }
        
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);
        
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error('Unable to link WebGL program:', gl.getProgramInfoLog(this.program));
            return;
        }
        
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.disable(gl.DEPTH_TEST);
        
        const positionAttribute = gl.getAttribLocation(this.program, 'a_position');
        const colorAttribute = gl.getAttribLocation(this.program, 'a_color');
        const sizeAttribute = gl.getAttribLocation(this.program, 'a_size');
        
        this.resolutionUniform = gl.getUniformLocation(this.program, 'u_resolution');
        
        this.positionBuffer = gl.createBuffer();
        this.colorBuffer = gl.createBuffer();
        this.sizeBuffer = gl.createBuffer();
    
        gl.useProgram(this.program);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(positionAttribute);
        gl.vertexAttribPointer(positionAttribute, 2, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.colors, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(colorAttribute);
        gl.vertexAttribPointer(colorAttribute, 4, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.sizeBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.sizes, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(sizeAttribute);
        gl.vertexAttribPointer(sizeAttribute, 1, gl.FLOAT, false, 0, 0);
        
        gl.uniform2f(this.resolutionUniform, this.cvs.width, this.cvs.height);
    }
    
    private compileShader(type: number, source: string): WebGLShader {
        const gl = this.gl;
        const shader = gl.createShader(type);
        if (!shader) {
            throw new Error('Failed to create shader');
        }
        
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error(`Shader compile error: ${info}`);
        }
        
        return shader;
    }
    
    start(): void {
        this.candraw = true;
        this.animate();
    }
    
    pause(): void {
        this.candraw = false;
    }
    
    unmount(): void {
        this.exit = true;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        window.removeEventListener('resize', this.resize.bind(this));
        this.candraw = false;
        
        // 清理WebGL资源
        const gl = this.gl;
        if (this.program) gl.deleteProgram(this.program);
        if (this.positionBuffer) gl.deleteBuffer(this.positionBuffer);
        if (this.colorBuffer) gl.deleteBuffer(this.colorBuffer);
        if (this.sizeBuffer) gl.deleteBuffer(this.sizeBuffer);
        setTimeout(() => {
            gl?.getExtension('WEBGL_lose_context')?.loseContext();
        }, 500);
    }
    
    async setColors(color: number[]): Promise<void> {
        this.generatedColors = this._generateSimilarColors(color, 7, 20);
        await this.initCircles();
    }
    
    async initCircles(): Promise<void> {
        let d = 500;
        this.cvs.style.opacity = '0';
        this.circles = [];
        
        for (let i = 0; i < this.generatedColors.length; i++) {
            let r = window.innerWidth / 4* devicePixelRatio;
            let x = this._getRandom(r, this.cvs.width - r);
            let y = this._getRandom(r, this.cvs.height - r);
            let dx = this._getRandom(window.innerWidth / -d, window.innerWidth / d) * devicePixelRatio;
            let dy = this._getRandom(window.innerWidth / -d, window.innerWidth / d) * devicePixelRatio;
            
            const rgb = this.generatedColors[i];
            const rgba: [number, number, number, number] = [
                rgb[0] / 255,
                rgb[1] / 255, 
                rgb[2] / 255,
                1 
            ];
            
            this.circles.push({ 
                x, y, dx, dy, r, 
                color: rgba
            });
        }
        
        this.circleCount = this.circles.length;
        
        // 重新分配数组大小
        this.positions = new Float32Array(this.circleCount * 2);
        this.colors = new Float32Array(this.circleCount * 4);
        this.sizes = new Float32Array(this.circleCount);
        
        // 更新缓冲区数据
        this.updateBuffers();
        
        // 重新配置WebGL缓冲区
        const gl = this.gl;
        const positionAttribute = gl.getAttribLocation(this.program!, 'a_position');
        const colorAttribute = gl.getAttribLocation(this.program!, 'a_color');
        const sizeAttribute = gl.getAttribLocation(this.program!, 'a_size');
        
        gl.useProgram(this.program!);
        
        // 重新绑定位置缓冲区
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(positionAttribute);
        gl.vertexAttribPointer(positionAttribute, 2, gl.FLOAT, false, 0, 0);
        
        // 重新绑定颜色缓冲区
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.colors, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(colorAttribute);
        gl.vertexAttribPointer(colorAttribute, 4, gl.FLOAT, false, 0, 0);
        
        // 重新绑定大小缓冲区
        gl.bindBuffer(gl.ARRAY_BUFFER, this.sizeBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.sizes, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(sizeAttribute);
        gl.vertexAttribPointer(sizeAttribute, 1, gl.FLOAT, false, 0, 0);
        
        this.cvs.style.opacity = '1';
    }
    
    private updateBuffers(): void {
        // 更新位置、颜色和大小数据
        for (let i = 0; i < this.circleCount; i++) {
            const circle = this.circles[i];
            const idx = i * 2;
            const colorIdx = i * 4;
            
            // 位置数据
            this.positions[idx] = circle.x;
            this.positions[idx + 1] = circle.y;
            
            // 颜色数据（已经是0-1范围的RGBA）
            this.colors[colorIdx] = circle.color[0];
            this.colors[colorIdx + 1] = circle.color[1];
            this.colors[colorIdx + 2] = circle.color[2];
            this.colors[colorIdx + 3] = circle.color[3];
            
            // 大小数据
            this.sizes[i] = circle.r;
        }
        
        // 上传数据到GPU
        const gl = this.gl;
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.positions);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.colors);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.sizeBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.sizes);
    }
    
    private updateCirclePositions(): void {
        for (let i = 0; i < this.circleCount; i++) {
            const circle = this.circles[i];
            const idx = i * 2;
            
            // 边界检测
            if (circle.x + circle.r > this.cvs.width || circle.x - circle.r < 0) {
                circle.dx = -circle.dx;
            }
            if (circle.y + circle.r > this.cvs.height || circle.y - circle.r < 0) {
                circle.dy = -circle.dy;
            }
            
            // 更新位置
            circle.x += circle.dx;
            circle.y += circle.dy;
            
            this.positions[idx] = circle.x;
            this.positions[idx + 1] = circle.y;
        }
    }
    
    private animate(): void {
        if (this.exit) return;
        this.animationId = requestAnimationFrame(this.animate.bind(this));
        
        if (!this.candraw) return;
        
        const now = performance.now();
        if (now - this.lastFrameTime < 16) return; // ~60fps
        this.lastFrameTime = now;
        
        // 更新圆形位置
        this.updateCirclePositions();
        
        // 上传新的位置数据到GPU
        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.positions);
        
        // 清除画布
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        // 绘制点（圆形）
        gl.drawArrays(gl.POINTS, 0, this.circleCount);
    }
    
    resize(): void {
        this.cvs.width = window.innerWidth * devicePixelRatio;
        this.cvs.height = window.innerHeight * devicePixelRatio;
        
        // 更新WebGL视口和分辨率
        this.gl.viewport(0, 0, this.cvs.width, this.cvs.height);
        
        if (this.program && this.resolutionUniform) {
            this.gl.useProgram(this.program);
            this.gl.uniform2f(this.resolutionUniform, this.cvs.width, this.cvs.height);
        }
        
        // 重新初始化圆形（因为画布大小变了）
        this.initCircles();
    }
    
    private _getRandom(min: number, max: number): number {
        return Math.random() * (max - min) + min;
    }
    
    private _generateSimilarColors(baseColor: number[], count: number, diff: number): number[][] {
        function getRandomOffset(maxDiff: number): number {
            return Math.floor(Math.random() * (maxDiff * 2 + 1)) - maxDiff;
        }
        
        function clampValue(value: number, min: number, max: number): number {
            return Math.min(Math.max(value, min), max);
        }
        
        if (!Array.isArray(baseColor) || baseColor.length !== 3 ||
            baseColor.some(c => c < 0 || c > 255)) {
            throw new Error('Invalid base color');
        }
        
        if (typeof count !== 'number' || count < 1) {
            throw new Error('Invalid count');
        }
        
        if (typeof diff !== 'number' || diff < 0 || diff > 100) {
            throw new Error('Invalid diff');
        }
        
        const maxDiff = Math.round((diff / 100) * 255);
        const colors: number[][] = [];
        
        for (let i = 0; i < count; i++) {
            const r = baseColor[0] + getRandomOffset(maxDiff);
            const g = baseColor[1] + getRandomOffset(maxDiff);
            const b = baseColor[2] + getRandomOffset(maxDiff);
            
            colors.push([
                clampValue(r, 0, 255),
                clampValue(g, 0, 255),
                clampValue(b, 0, 255)
            ]);
        }
        
        lastColorSave = colors;
        return colors;
    }
}