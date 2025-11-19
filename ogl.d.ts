// ogl.d.ts

declare module 'ogl' {
    export class Renderer {
        constructor(options?: {
            canvas?: HTMLCanvasElement;
            width?: number;
            height?: number;
            dpr?: number;
            alpha?: boolean;
            depth?: boolean;
            stencil?: boolean;
            antialias?: boolean;
            premultipliedAlpha?: boolean;
            preserveDrawingBuffer?: boolean;
            powerPreference?: string;
            autoClear?: boolean;
            webgl?: number;
        });
        gl: WebGLRenderingContext | WebGL2RenderingContext;
        setSize(width: number, height: number): void;
        render({ scene, camera }: { scene?: any; camera?: any }): void;
    }

    export class Program {
        constructor(gl: WebGLRenderingContext | WebGL2RenderingContext, options: {
            vertex: string;
            fragment: string;
            uniforms?: { [key: string]: { value: any } };
        });
        uniforms: { [key: string]: { value: any } };
    }

    export class Mesh {
        constructor(gl: WebGLRenderingContext | WebGL2RenderingContext, options: {
            geometry: any;
            program: Program;
        });
    }

    export class Triangle {
        constructor(gl: WebGLRenderingContext | WebGL2RenderingContext, options?: any);
    }

    // شما می‌توانید در صورت نیاز، کلاس‌های دیگر ogl را نیز به همین شکل اضافه کنید
}