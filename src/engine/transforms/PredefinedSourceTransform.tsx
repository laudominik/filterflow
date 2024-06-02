import {jsonObject, jsonMember} from 'typedjson';
import SourceTransform from './SourceTransform';
import SourceComponent from '../../components/transforms/SourceComponent';
import { GUID } from '../iengine';


const customWidth = 256
const customHeight = 256

@jsonObject
export default abstract class PredefinedSourceTransform extends SourceTransform {
    created: boolean
    fragment?: string
    argument: number

    constructor(name: string = "Custom source", argument: number, fragment?: string) {
        super(name);
        this.created = false;
        this.fragment = fragment;
        this.argument = argument
    }

    public could_update(): boolean {
        return true
    }

    async apply(_: Array<OffscreenCanvas | undefined>): Promise<OffscreenCanvas | undefined> {
        if (!this.created) {
            await this.createImage();
            this.created = true;
        };

        return this.canvas;
    }

    async createImage() {

        this.drawImage()

        this.hash = crypto.randomUUID();
        this.engine.requestUpdate(this.meta.id);
    }

    drawImage() {
        const vertexShaderSource = `
                attribute vec2 a_position;
                varying vec2 v_texCoord;

                void main() {
                    gl_Position = vec4(a_position, 0, 1);
                    v_texCoord = vec2((a_position.x + 1.0) / 2.0, 1.0 - (a_position.y + 1.0) / 2.0);
                }
            `;

        const fragmentShaderSource = this.fragment ?? `
                // these params should be for all filters
                precision mediump float;
                varying vec2 v_texCoord;
                uniform float u_arg;
                
                void main() {
                    //gl_FragColor = texture2D(u_image, v_texCoord);
                    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                }
            `;

        this.canvas.width = customWidth;
        this.canvas.height = customWidth;

        const gl = this.gl
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);

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
            -1, -1,
            1, -1,
            -1, 1,
            1, 1
        ]), gl.STATIC_DRAW);

        const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

        const argumentLocation = gl.getUniformLocation(program, 'u_arg');
        gl.uniform1f(argumentLocation, this.argument);

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        gl.deleteProgram(program);
        gl.deleteBuffer(positionBuffer);
    }

    paramView(guid: GUID) {
        return <SourceComponent guid={guid}></SourceComponent>
    }

    visualizationView(guid: string) {
        return <></>
    }
}