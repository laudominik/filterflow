
import "reflect-metadata"
import { jsonObject } from "typedjson";
import Transform, { KVParams } from "../Transform";
import { ReactNode } from "react";
import { GUID } from "../nodeResponse";
import PoolingComponent from "../../components/transforms/PoolingComponent";
import { CanvasSelection } from "../../stores/simpleFilterStore";
import PoolingVisualizationComponent from "../../components/visualizations/PoolingVisualizationComponent";


@jsonObject
class PoolingTransform extends Transform {

    image?:string
    fragment: string;
    poolingSize: number;
    poolingStep: number;
    
    constructor(name?: string, injectedFunction?: string, initialPixelValue?: string) {
        super(name ?? 'Pooling', '#E2E7F4');
        this.poolingSize = 3;
        this.poolingStep = 3;
        this.params = {...this.params, "pooling_size" : this.poolingSize, "pooling_step": this.poolingStep };

        const poolingShader = `
                // these params should be for all filters
                precision mediump float;
                varying vec2 v_texCoord;
                uniform vec2 u_image_dims;
                uniform sampler2D u_image;
                uniform int u_pooling_size;
                
                void main() {
                    vec2 d = 1.0/u_image_dims;
                    float poolingRadius = float(u_pooling_size-1)/2.0;
                    vec3 sum;
                    vec3 outVal = ${initialPixelValue ?? "vec3(0.0,0.0,0.0)"};
                    for(int i = 0; i < 5; i++){
                        if(i >= u_pooling_size) continue;
                        for(int j = 0; j < 5; j++){
                            if(j >= u_pooling_size) continue;
                            
                            vec2 pixelCoords = v_texCoord + vec2(float(j) - poolingRadius, float(i) - poolingRadius) * d;
                            vec3 pixelColor = texture2D(u_image, pixelCoords).rgb;
                            
                            // here goes the function injection, for now just max pool
                            ${injectedFunction ?? ""}
                        }
                    }

                    gl_FragColor = vec4(outVal, 1.0);
                }
            `;

            this.fragment = poolingShader;
    }

    public fromPositionToSourceSelection(position: [number, number]): CanvasSelection {
        const poolingSize = this.params["pooling_size"];
    
        const posNormalizedX = Math.floor(position[0] / poolingSize) * poolingSize 
        const posNormalizedY = Math.floor(position[1] / poolingSize) * poolingSize 

        const x = (posNormalizedX - Math.floor((poolingSize-1)/2))
        const y = (posNormalizedY - Math.floor((poolingSize-1)/2))

        return {start: [x,y], size: [poolingSize, poolingSize], center: [posNormalizedX, posNormalizedY]}
    }
    public fromDestinationToSourcePosition(positon: [number, number]): [number, number] {
        const step = this.params["pooling_step"];
        return [positon[0] * step, positon[1] * step];
    }

    public fromSourceToDestinationPosition(positon: [number, number]): [number, number] {
        const step = this.params["pooling_step"];
        return [Math.floor(positon[0] / step), Math.floor(positon[1] / step)];
    }

    paramView(guid: GUID) {
        return <PoolingComponent guid={guid}/>
    }

    async _apply(input: Array<OffscreenCanvas>): Promise<OffscreenCanvas> {
        this.poolingSize = this.params["pooling_size"]
        this.poolingStep = this.params["pooling_step"]
        const vertexShaderSource = `
                attribute vec2 a_position;
                varying vec2 v_texCoord;

                void main() {
                    gl_Position = vec4(a_position, 0, 1);
                    v_texCoord = vec2((a_position.x + 1.0) / 2.0, 1.0 - (a_position.y + 1.0) / 2.0);
                }
            `;

            // formula: https://pytorch.org/docs/stable/generated/torch.nn.MaxPool2d.html
            this.canvas.width = Math.floor((input[0].width - 1)/this.poolingStep + 1);
            this.canvas.height = Math.floor((input[0].height - 1)/this.poolingStep + 1);

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

            const poolingStepLocation = gl.getUniformLocation(program, 'u_pooling_step');
                gl.uniform1i(poolingStepLocation, this.poolingSize);
            
            const poolingSizeLocation = gl.getUniformLocation(program, 'u_pooling_size');
                gl.uniform1i(poolingSizeLocation, this.poolingSize);
            
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

export default PoolingTransform;