import { useState, CSSProperties, useContext, useSyncExternalStore, useRef, useEffect } from 'react'
import { faMagnifyingGlassPlus, faMagnifyingGlassMinus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'react-bootstrap';
import ImageMap from '../../util/ImageMap';
import { FilterStoreContext } from '../../stores/simpleFilterStore';

export function InputPreview({ sourceId }: { sourceId: string }) {

    return <Preview sourceId={sourceId} title="Input" />;
}

export function OutputPreview({ sourceId }: { sourceId: string }) {
    return <Preview sourceId={sourceId} title="Output" />;
}

function Preview({ title, sourceId }: { title: string, sourceId: string }) {

    const [isFullscreen, setIsFullscreen] = useState(false);
    const filterStore = useContext(FilterStoreContext);

    const offscreen_canvas = useSyncExternalStore(filterStore.subscribe(sourceId) as any, filterStore.getView(sourceId));
    const canvas_hash = useSyncExternalStore(filterStore.subscribe(sourceId) as any, filterStore.getHash(sourceId));
    
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(()=>{
        if(offscreen_canvas && canvasRef.current){
            canvasRef.current.width = offscreen_canvas.width;
            canvasRef.current.height = offscreen_canvas.height;
            canvasRef.current.getContext("2d")?.drawImage(offscreen_canvas,0,0);
        }
    },[offscreen_canvas, canvas_hash])

    return <div className="preview" style={componentStyle(isFullscreen)}>
        <div className="pipelineBar">
            <div>{title}</div>
            <Button className="border-0 bg-transparent" onClick={() => setIsFullscreen(!isFullscreen)}>
                <FontAwesomeIcon className="iconInCard" icon={isFullscreen ? faMagnifyingGlassMinus : faMagnifyingGlassPlus} />
            </Button>
        </div>
        <div className="centeredImage">
            <canvas ref={canvasRef} />
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