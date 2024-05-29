import { ChangeEvent, useCallback, useContext, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { nodeStoreContext } from "../../stores/context";
import { GUID } from "../../engine/iengine";
import { Form } from "react-bootstrap";
import "../preview_container/Preview.css"
import "../graph_view/GraphNode.css"

type ColorMask = [boolean, boolean, boolean];


export default function SourceComponent({guid} : {guid: GUID}){
    const nodeContext = useContext(nodeStoreContext);
    const node = useSyncExternalStore(nodeContext.subscribeNode(guid), nodeContext.getNode(guid));
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const isValid = node.value.valid;
    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            nodeContext.updateParam(guid, {image: event.target?.result as string})
        }

        reader.readAsDataURL(file);
    }

    const drawImage = (input: OffscreenCanvas, destination: HTMLCanvasElement, mask: ColorMask) => {
        const vertexShaderSource = `
                attribute vec2 a_position;
                varying vec2 v_texCoord;

                void main() {
                    gl_Position = vec4(a_position, 0, 1);
                    v_texCoord = vec2((a_position.x + 1.0) / 2.0, 1.0 - (a_position.y + 1.0) / 2.0);
                }
            `;

        const fragmentShaderSource = `
                // these params should be for all filters
                precision mediump float;
                varying vec2 v_texCoord;
                uniform sampler2D u_image;
                
                void main() {
                    gl_FragColor = texture2D(u_image, v_texCoord);
                }
            `;

            destination.width = input.width;
            destination.height = input.height;
            
            const gl = destination.getContext("webgl")!
            gl.viewport(0,0, destination.width, destination.height);

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

                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, input);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.colorMask(mask[0], mask[1], mask[2], true);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
            gl.deleteProgram(program);
            gl.deleteBuffer(positionBuffer);
            gl.deleteTexture(texture);
    }

    useEffect(() =>{
        const offscreenCanvas = node.value.canvas;
        if (offscreenCanvas && canvasRef.current){
            drawImage(offscreenCanvas, canvasRef.current, [true, true, true])
        }

    },[node]);
    
    return <div className="imageContainer">
        <div className="centeredImage"><canvas ref={canvasRef} /></div>
    </div>
    
}