// @ts-nocheck
import { createContext, createRef, useEffect, useRef } from "react";
import Transform  from '../engine/Transform'

type MarkedListener = CallableFunction & { id: Number }

class simpleFilterStore {
    listeners: MarkedListener[]
    transforms: Transform[]
    
    // hard wired tmp values, change later to engine ref
    source?: string
    destination?: string
    kernel?: string[][]

    constructor() {
        this.listeners = [];
        this.transforms = [];
        this.kernel = Array(3).fill(0).map(() => new Array(3).fill(0));
    }

    // internal function called to return snapshot of data with id
    private _getView(id: Number) {
        if (id === 0) {
            return this.source
        }
        if (id === 1) {
            return this.destination
        }
        return this.kernel
        // TODO: change it
    }

    // internal function register listening on specific id
    private _subscribeView(id: Number, listener: MarkedListener) {
        listener.id = id;
        this.listeners = [...this.listeners, listener]
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    // helper functions
    // due to inability to pass additional args its the best way to add args
    public subscribeView(id: Number) {
        return this._subscribeView.bind(this, id);
    }

    public getView(id: Number) {
        return this._getView.bind(this, id);
    }

    public setKernel(kernel: string[][]){
        this.kernel = kernel;
        this.emitChange(69);
        if(!this.source) return;
        this.applyTransforms(this.source);
    }

    // set filter store root mask what is happening with data
    public setSource(imageEncoded: string) {
        this.source = imageEncoded;
        //callback hell
        this.applyTransforms(imageEncoded)
    }

    private emitChange(id: Number) {
        this.listeners.filter(f => f.id === id).forEach(f => f())
    }

    private applyTransforms(imageEncoded: string){
        // the entire logic should be moved to the engine
        const vertexShaderSource = `
                attribute vec2 a_position;
                varying vec2 v_texCoord;

                void main() {
                    gl_Position = vec4(a_position, 0, 1);
                    v_texCoord = vec2((a_position.x + 1.0) / 2.0, 1.0 - (a_position.y + 1.0) / 2.0);
                }
            `;
        

        // TODO: should take the fragment from transform object
        const fragmentShaderSource = `
                // these params should be for all filters
                precision mediump float;
                varying vec2 v_texCoord;
                uniform vec2 u_image_dims;
                uniform sampler2D u_image;

                // these params should be for kernels and pooling
                uniform mat2 u_kernel2;
                uniform mat3 u_kernel3;
                uniform mat4 u_kernel4;
                uniform int u_kernel_size;
                
                void main() {
                    vec2 d = 1.0/u_image_dims;
                    float kernelRadius = float(u_kernel_size-1)/2.0;
                    vec3 sum;

                    for(int i = 0; i < 5; i++){
                        if(i >= u_kernel_size) continue;
                        for(int j = 0; j < 5; j++){
                            if(j >= u_kernel_size) continue;
                            
                            vec2 pixelCoords = v_texCoord + vec2(float(j) - kernelRadius, float(i) - kernelRadius) * d;
                            float kernel_weight = 0.0;
                            if(u_kernel_size == 2){
                                kernel_weight = u_kernel2[i][j];
                            } else if(u_kernel_size == 3){
                                kernel_weight = u_kernel3[i][j];
                            } else if(u_kernel_size == 4){
                                kernel_weight = u_kernel4[i][j];
                            }

                            sum += kernel_weight * texture2D(u_image, pixelCoords).rgb;
                        }
                    }

                    gl_FragColor = vec4(sum, 1.0);
                }
            `;

        const dispatch = async (input: string) => {
            const image = new Image();
            image.onload = () => {
                const canvas = new OffscreenCanvas(image.width, image.height);
                
                const gl = canvas.getContext('webgl')!;
                
                const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
                    gl.shaderSource(vertexShader, vertexShaderSource);
                    gl.compileShader(vertexShader);
    
                const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
                    gl.shaderSource(fragmentShader, fragmentShaderSource);
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

                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            
                let kernelF = this.kernel!.map(el => el.map(e => parseFloat(e)));
                let kernelLocation = gl.getUniformLocation(program, 'u_kernel2');
                    gl.uniformMatrix2fv(kernelLocation, false, new Float32Array([].concat(...kernelF)));
                kernelLocation = gl.getUniformLocation(program, 'u_kernel3');
                    gl.uniformMatrix3fv(kernelLocation, false, new Float32Array([].concat(...kernelF)));
                kernelLocation = gl.getUniformLocation(program, 'u_kernel4');
                    gl.uniformMatrix4fv(kernelLocation, false, new Float32Array([].concat(...kernelF)));
                const imageDimsLocation = gl.getUniformLocation(program, 'u_image_dims');
                    gl.uniform2fv(imageDimsLocation, [image.width, image.height]);
                
                const kernelSizeLocation = gl.getUniformLocation(program, 'u_kernel_size');
                    gl.uniform1i(kernelSizeLocation, kernelF.length);
                
                gl.clearColor(0, 0, 0, 0);
                gl.clear(gl.COLOR_BUFFER_BIT);
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            
                gl.deleteShader(vertexShader);
                gl.deleteShader(fragmentShader);
                gl.deleteProgram(program);
                gl.deleteBuffer(positionBuffer);
                gl.deleteTexture(texture);
                
                // back to base64
                canvas.convertToBlob({type:"image/png",quality:1}).then((blob:Blob) => {
                    this.destination=URL.createObjectURL(blob);
                    this.emitChange(0);
                    this.emitChange(1);
                });
               
            }
            image.src = input;
        }
        dispatch(imageEncoded)
    }
};

const FilterStoreContext = createContext(new simpleFilterStore()) // using it without provider makes it global

export { FilterStoreContext }