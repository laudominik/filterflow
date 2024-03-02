
import "reflect-metadata"
import { jsonObject } from "typedjson";
import KernelComponent from "../../components/transforms/KernelComponent";
import Transform, { KVParams } from "../Transform";
import { ReactNode } from "react";
import { CanvasSelection } from "../../stores/simpleFilterStore";
import { GUID } from "../engine";
import ConvolutionVisualizationComponent from "../../components/visualizations/ConvolutionVisualizationComponent";
import MorphoLogicComponent from "../../components/transforms/MorphologyComponent";

const linearConvolutionShader = `
                // these params should be for all filters
                precision mediump float;
                varying vec2 v_texCoord;
                uniform vec2 u_image_dims;
                uniform sampler2D u_image;

                // these params should be for kernels and pooling
                uniform ivec2 u_kernel_size;
                const int MAX_SIZE = 10;

                
                void main() {
                    vec2 d = 1.0/u_image_dims;
                    float treshold = 0.5;
                    float kernelRadiusX = float(u_kernel_size.x-1)/2.0;
                    float kernelRadiusY = float(u_kernel_size.y-1)/2.0;
                    
                    bvec3 values = bvec3(false,false,false);
                    for(int ii = 0; ii < MAX_SIZE; ii++){
                        if(ii >= u_kernel_size.y) break;
                        for(int i = 0; i < MAX_SIZE; i++){
                            if(i >= u_kernel_size.x) break;
                            
                            vec2 pixelCoords = v_texCoord + vec2(float(i) - kernelRadiusX, float(ii) - kernelRadiusY) * d;
                            vec3 res = texture2D(u_image, pixelCoords).rgb;
                            values.r = res.r > treshold || values.r;
                            values.g = res.g > treshold || values.g;
                            values.b = res.b > treshold || values.b;
                        }
                    }

                    gl_FragColor = vec4(float(values.r), float(values.g), float(values.b), 1.0);
                }
            `;


@jsonObject
class MorphologicTransform extends Transform {

    image?:string
    kernelSize: [number, number];
    fragment: string;
    
    
    constructor(name?: string, injectedInitialState?: string, injectedFunction?: string) {
        super(name ?? 'Custom kernel', '#F2F4E2');
        this.kernelSize = [3,3];
        this.params = {...this.params, "kernel_size": this.kernelSize};
        this.fragment = `
        // these params should be for all filters
        precision mediump float;
        varying vec2 v_texCoord;
        uniform vec2 u_image_dims;
        uniform sampler2D u_image;

        // these params should be for kernels and pooling
        uniform ivec2 u_kernel_size;
        const int MAX_SIZE = 10;

        
        void main() {
            vec2 d = 1.0/u_image_dims;
            float treshold = 0.5;
            float kernelRadiusX = float(u_kernel_size.x-1)/2.0;
            float kernelRadiusY = float(u_kernel_size.y-1)/2.0;
            
            ${injectedInitialState ?? ""}
            for(int ii = 0; ii < MAX_SIZE; ii++){
                if(ii >= u_kernel_size.y) break;
                for(int i = 0; i < MAX_SIZE; i++){
                    if(i >= u_kernel_size.x) break;
                    
                    vec2 pixelCoords = v_texCoord + vec2(float(i) - kernelRadiusX, float(ii) - kernelRadiusY) * d;
                    vec3 res = texture2D(u_image, pixelCoords).rgb;
                    ${injectedFunction ?? ""}
                }
            }

            gl_FragColor = vec4(float(values.r), float(values.g), float(values.b), 1.0);
        }
    `;
    }

    public fromPositionToSourceSelection(position: [number, number]): CanvasSelection {
        const kernelX = this.params["kernel_size"];
        const kernelY = this.params["kernel_y"];
        const x = position[0] - Math.floor((kernelX-1)/2)
        const y = position[1] - Math.floor((kernelY-1)/2)

        return {start: [x,y], size: [kernelX, kernelY], center: position}
    }

    paramView(guid: GUID) {
        /*
         *  tbd: how could we split the view logic here and keep it nice and tidy
         */
        return <MorphoLogicComponent guid={guid}/>
    }

    visualizationView(guid: string) {
        return <></>
    }

    async _apply(input: Array<OffscreenCanvas>): Promise<OffscreenCanvas> {
        this.kernelSize = this.params["kernel_size"]
        const vertexShaderSource = `
                attribute vec2 a_position;
                varying vec2 v_texCoord;

                void main() {
                    gl_Position = vec4(a_position, 0, 1);
                    v_texCoord = vec2((a_position.x + 1.0) / 2.0, 1.0 - (a_position.y + 1.0) / 2.0);
                }
            `;


            this.canvas.width = input[0].width;
            this.canvas.height = input[0].height;

            const gl = this.gl
            gl.viewport(0,0, this.canvas.width, this.canvas.height);

            const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
                gl.shaderSource(vertexShader, vertexShaderSource);
                gl.compileShader(vertexShader);

            const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
                gl.shaderSource(fragmentShader, this.fragment);
                gl.compileShader(fragmentShader);

            const program = gl.createProgram()!;
                gl.attachShader(program, vertexShader);
                gl.attachShader(program, fragmentShader);
                gl.linkProgram(program);
                gl.useProgram(program);

            const positionBuffer = gl.createBuffer()!;
                gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                    -1,    -1, 
                    1,     -1, 
                    -1,    1,
                    1,     1
                ]), gl.STATIC_DRAW);
            
            const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
                gl.enableVertexAttribArray(positionAttributeLocation);
                gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);  
            
            const texture = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, texture);

                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, input[0]);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        
            const imageDimsLocation = gl.getUniformLocation(program, 'u_image_dims');
                gl.uniform2fv(imageDimsLocation, [input[0].width, input[0].height]);
            
            const kernelSizeLocation = gl.getUniformLocation(program, 'u_kernel_size');
                gl.uniform2iv(kernelSizeLocation, this.kernelSize);

            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
            gl.deleteProgram(program);
            gl.deleteBuffer(positionBuffer);
            gl.deleteTexture(texture);

            return this.canvas;
    }

}

export default MorphologicTransform;