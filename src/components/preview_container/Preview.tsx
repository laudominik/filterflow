import { useState, CSSProperties, useContext, useSyncExternalStore, useRef, useEffect } from 'react'
import { faMagnifyingGlassPlus, faMagnifyingGlassMinus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'react-bootstrap';
import { Channel, FilterStoreContext, PreviewSelections } from '../../stores/simpleFilterStore';

export function InputPreview({ sourceId }: { sourceId: string }) {

    return <Preview sourceId={sourceId} title="Input" />;
}

export function OutputPreview({ sourceId }: { sourceId: string }) {
    return <Preview sourceId={sourceId} title="Output" />;
}

type ColorMask = {red: boolean, green: boolean, blue: boolean};

function Preview({ title, sourceId }: { title: string, sourceId: string }) {

    const [isFullscreen, setIsFullscreen] = useState(false);
    const filterStore = useContext(FilterStoreContext);

    const offscreen_canvas = useSyncExternalStore(filterStore.subscribe(sourceId) as any, filterStore.getView(sourceId));
    const canvas_hash = useSyncExternalStore(filterStore.subscribe(sourceId) as any, filterStore.getHash(sourceId));
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const previewSelections = useSyncExternalStore(filterStore.subscribeCanvasSelections.bind(filterStore) as any, filterStore.getPreviewSelections.bind(filterStore))

    const preview = useSyncExternalStore(filterStore.subscribePreview.bind(filterStore), filterStore.getPreview.bind(filterStore))
    // TODO: decide whenever to visualize or not
    
    const handleMouse = (e : React.MouseEvent) => {
        if (!canvasRef.current) return;
        if (filterStore.previewMouseLocked) return;
        let rect = e.currentTarget.getBoundingClientRect();

        let x = (e.clientX - rect.x)*canvasRef.current.width/rect.width;
        let y = (rect.height - (e.clientY - rect.y))*canvasRef.current.height/rect.height;

        // Math.floor() should be good enought for positive numbers
        
        let pos: [number, number] = [Math.floor(x), Math.floor(y)]
        // TODO: redundant if we know on what node we are
        if(preview.start === sourceId)
            filterStore.setCanvasSourcePointer(pos)
        else if(preview.end === sourceId)
            filterStore.setCanvasDestinationPointer(pos)
    }

    const overlayPos = (pos: PreviewSelections):CSSProperties => {
        if (!canvasRef.current)
        return {}
        let res

        // TODO: can be cleaner
        if(preview.start === sourceId)
            res = pos.source
        else if (preview.end === sourceId)
            res = pos.destination

        if(!res) return {}

        let x = res.start[0]/canvasRef.current.width
        let y = res.start[1]/canvasRef.current.height
        let w = res.size[0]/canvasRef.current.width
        let h = res.size[1]/canvasRef.current.height

        // using css percent to skip container height retrieval
        return {
            left: `${x*100}%`,
            top: `${(1-y-h)*100}%`,
            width: `${w*100}%`,
            height: `${h*100}%`,
        }
    }


    useEffect(()=>{
        if(offscreen_canvas && canvasRef.current){
            let mask: ColorMask = {red: true, green: true, blue: true};
            if (preview.previewChannels[0] != Channel.NONE && preview.previewChannels[0] != Channel.GRAY){
                mask = {red: false,green: false, blue: false};
                preview.previewChannels.forEach((value) =>{
                    switch(value){
                        case Channel.RED:
                            mask.red = true;
                            break;
                        case Channel.GREEN:
                            mask.green = true;
                            break;
                        case Channel.BLUE:
                            mask.blue = true;
                            break;
                    }
                })
            }
            drawImage(offscreen_canvas, canvasRef.current, mask)
        }
    },[offscreen_canvas, canvas_hash, preview])

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
            gl.colorMask(mask.red, mask.green, mask.blue, true);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
            gl.deleteProgram(program);
            gl.deleteBuffer(positionBuffer);
            gl.deleteTexture(texture);
    }


    return <div className="preview" style={componentStyle(isFullscreen)}>
        <div className="pipelineBar">
            <div>{title}</div>
            <Button className="border-0 bg-transparent" onClick={() => setIsFullscreen(!isFullscreen)}>
                <FontAwesomeIcon className="iconInCard" icon={isFullscreen ? faMagnifyingGlassMinus : faMagnifyingGlassPlus} />
            </Button>
        </div>
        <div className="imageContainer">
            <div className='centeredImage' onMouseMove={handleMouse} onClick={() => filterStore.previewMouseLocked = !filterStore.previewMouseLocked}>
                {/* somehow onMouseMove on canvas don't works */}
                <canvas ref={canvasRef}/>
                <div className='overlay' style={overlayPos(previewSelections)}>
                </div>
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