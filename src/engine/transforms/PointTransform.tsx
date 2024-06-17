
import { jsonObject } from "typedjson";
import PointComponent from "../../components/transforms/PointComponent";
import Transform from "../Transform";
import { GUID } from "../engine";

@jsonObject({name:"PointTransform"})
class PointTransform extends Transform {


    image?:string
    fragmentShader: string;
    argument: number;
    parametrized: boolean;
    
    constructor(name?: string, parametrized?: boolean, fragmentShader? : string) {
        super(name ?? 'Point transform', '#F4E2F4');
        this.argument = 0;
        this.params = {...this.params, "argument" : this.argument};
        this.gl = this.canvas.getContext('webgl', {preserveDrawingBuffer: true})!;
        this.parametrized = parametrized ?? false
        this.fragmentShader = fragmentShader ?? `
        precision mediump float;
        varying vec2 v_texCoord;
        uniform sampler2D u_image;

        uniform float u_arg;
        
        void main() {
            vec2 pixelCoords = v_texCoord ;
            vec3 col = texture2D(u_image, pixelCoords).rgb;
            gl_FragColor = vec4(col, 1.0);
        }
    `
    }

    paramView(guid: GUID) {

        return <PointComponent guid={guid} parametrized={this.parametrized}/>
    }

    visualizationView(guid: string) {
        return <></>
    }

    async _apply(input: Array<OffscreenCanvas>): Promise<OffscreenCanvas> {
        const vertexShaderSource = `
                attribute vec2 a_position;
                varying vec2 v_texCoord;

                void main() {
                    gl_Position = vec4(a_position, 0, 1);
                    v_texCoord = vec2((a_position.x + 1.0) / 2.0, 1.0 - (a_position.y + 1.0) / 2.0);
                }
            `;

            // for now copy-paste, will change later
            this.canvas.width = input[0].width;
            this.canvas.height = input[0].height;

            const gl = this.gl
            gl.viewport(0,0, this.canvas.width, this.canvas.height);

            const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
                gl.shaderSource(vertexShader, vertexShaderSource);
                gl.compileShader(vertexShader);

            const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
                gl.shaderSource(fragmentShader, this.fragmentShader);
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
         
            const argumentLocation = gl.getUniformLocation(program, 'u_arg');
                gl.uniform1f(argumentLocation, this.params["argument"]);
            
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

export default PointTransform;