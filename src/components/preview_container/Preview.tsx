import { useState, CSSProperties, useContext, useSyncExternalStore, useRef, useEffect } from 'react'
import { faMagnifyingGlassPlus, faMagnifyingGlassMinus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'react-bootstrap';
import { Channel, FilterStoreContext, PreviewSelections } from '../../stores/simpleFilterStore';
import { nodeStoreContext, previewStoreContext } from '../../stores/context';
import { PreviewStore } from '../../stores/previewStore';

export function InputPreview({ sourceId, previewName, allowFullscreen = true }: { sourceId: string, previewName: string, allowFullscreen? : boolean }) {
    return <Preview sourceId={sourceId} previewName={previewName} title="Input" allowFullscreen={allowFullscreen}/>;
}

export function OutputPreview({ sourceId, allowFullscreen = true }: { sourceId: string, allowFullscreen?: boolean }) {
    return <Preview sourceId={sourceId} previewName={sourceId} title="Output" allowFullscreen={allowFullscreen}/>;
}

type ColorMask = [boolean, boolean, boolean];

function Preview({ title, sourceId, allowFullscreen, previewName }: { title: string, sourceId: string, allowFullscreen: boolean, previewName: string}) {
    const nodeContext = useContext(nodeStoreContext);
    const node = useSyncExternalStore(nodeContext.subscribeNode(sourceId), nodeContext.getNode(sourceId));
    const previewNode = useSyncExternalStore(nodeContext.subscribeNode(previewName), nodeContext.getNode(previewName));
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const previewContext = useContext(previewStoreContext);
    const previewStore = previewContext.getPreviewStore(previewName)!;
    const previewSelections = useSyncExternalStore(previewStore.subscribeSelection.bind(previewStore) as any, previewStore.getSelection.bind(previewStore))
    
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
   
    const [isFullscreen, setIsFullscreen] = useState(false);

    const handleMouse = (e : React.MouseEvent) => {
        if (!canvasRef.current) return;
        if (previewStore.getSelectionLocked()) return 
        let rect = e.currentTarget.getBoundingClientRect();

        let x = (e.clientX - rect.x)*canvasRef.current.width/rect.width;
        let y = (rect.height - (e.clientY - rect.y))*canvasRef.current.height/rect.height;
        
        let pos: [number, number] = [Math.floor(x), Math.floor(y)]
        let selection = previewStore.getSelection()
        
        // if output
        if(sourceId == previewName){
            selection.pointer = {
                source: node.value.fromDestinationToSourcePosition(pos),
                destination: pos
            }
            selection.preview = {
                source: node.value.fromPositionToSourceSelection(selection.pointer.source),
                destination: node.value.fromPositionToSelection(selection.pointer.destination)
            }
        } else {
            // something wrong here!
            selection.pointer = {
                source: pos,
                destination: previewNode.value.fromSourceToDestinationPosition(pos)
            }
            selection.preview = {
                source: previewNode.value.fromPositionToSourceSelection(selection.pointer.source),
                destination: previewNode.value.fromPositionToSelection(selection.pointer.destination)
            }
        }
        previewStore.updateSelection(
            selection.pointer,
            selection.preview,
            selection.channel
        )
    }

    const overlayPos = (pos: PreviewSelections):CSSProperties => {
        if (!canvasRef.current)
        return {}
        let res

        if(sourceId == previewName){
            res = pos.destination
        } else {
            res = pos.source
        }

        if(!res) return {}

        let x = res.start[0] >= 0 ? res.start[0]/canvasRef.current.width : 0
        let y = res.start[1] >= 0 ? res.start[1]/canvasRef.current.height : 0
        let w = res.size[0]/canvasRef.current.width
        let h = res.size[1]/canvasRef.current.height
        
        if(res.start[0] < 0) w = (res.size[0] + res.start[0])/canvasRef.current.width
        if(res.start[1] < 0) h = (res.size[1] + res.start[1])/canvasRef.current.height
        if(res.start[0] + res.size[0] > canvasRef.current.width) w = 1 - x
        if(res.start[1] + res.size[1] > canvasRef.current.width) h = 1 - y
        // using css percent to skip container height retrieval
        return {
            left: `${x*100}%`,
            top: `${(1-y-h)*100}%`,
            width: `${w*100}%`,
            height: `${h*100}%`,
        }
    }

    useEffect(()=>{
        const offscreenCanvas = node.value.canvas;
        if(offscreenCanvas && canvasRef.current){
            let mask: ColorMask = [true, true, true]
            
            if (previewSelections.channel != Channel.NONE && previewSelections.channel != Channel.GRAY){
                mask = [
                    previewSelections.channel == Channel.RED,
                    previewSelections.channel == Channel.GREEN,
                    previewSelections.channel == Channel.BLUE
                ]
            }
            drawImage(offscreenCanvas, canvasRef.current, mask)
        }
    },[previewStore, previewSelections, node])


    return <div className="preview" style={componentStyle(isFullscreen)}>
        <div className="pipelineBar">
            <div>{title}</div>
            {
                allowFullscreen ? 
                <Button className="border-0 bg-transparent" onClick={() => setIsFullscreen(!isFullscreen)}>
                    <FontAwesomeIcon className="iconInCard" icon={isFullscreen ? faMagnifyingGlassMinus : faMagnifyingGlassPlus} />
                </Button> 
                : 
                <></>
            }
        </div>
        <div className="imageContainer">
            <div className='centeredImage' onMouseMove={handleMouse} onClick={() => previewStore.updateSelectionLocked(!previewStore.getSelectionLocked())}>
                    {node.value.valid ? <canvas ref={canvasRef} />: <>ERROR</>}
                    {previewStore.getSelection().channel != Channel.NONE ? <div className='overlay' style={overlayPos(previewSelections.preview)}></div> : <></>}
            </div>
        </div>
    </div>
}

function componentStyle(isFullscreen: Boolean): CSSProperties {
    if (!isFullscreen) {
        return {};
    }
    return {
        position: "fixed",
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 9999
    };
}