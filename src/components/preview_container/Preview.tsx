import { useState, CSSProperties, useContext, useSyncExternalStore, useRef, useEffect, MouseEventHandler } from 'react'
import { faMagnifyingGlassPlus, faMagnifyingGlassMinus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'react-bootstrap';
import ImageMap from '../../util/ImageMap';
import { CanvasPointer, CanvasSelection, FilterStoreContext } from '../../stores/simpleFilterStore';

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
    const canvasSelections = useSyncExternalStore(filterStore.subscribeCanvasSelections.bind(filterStore) as any, filterStore.getCanvasSelections.bind(filterStore))

    const preview = useSyncExternalStore(filterStore.subscribePreview.bind(filterStore), filterStore.getPreview.bind(filterStore))
    // TODO: decide whenever to visualize or not
    
    const handleMouse = (e : React.MouseEvent) => {
        if (!canvasRef.current) return;
        let rect = e.currentTarget.getBoundingClientRect();

        let x = (e.clientX - rect.x)*canvasRef.current.width/rect.width;
        let y = (e.clientY - rect.y)*canvasRef.current.height/rect.height;

        // Math.floor() should be good enought for positive numbers
        
        let pos: [number, number] = [Math.floor(x), Math.floor(y)]
        // TODO: redundant if we know on what node we are
        if(preview.start === sourceId)
            filterStore.setCanvasSourcePointer(pos)
        else if(preview.end === sourceId)
            filterStore.setCanvasDestinationPointer(pos)
    }

    const overlayPos = (pos: CanvasSelection):CSSProperties => {
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
            top: `${y*100}%`,
            width: `${w*100}%`,
            height: `${h*100}%`,
        }
    }


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
        <div className="imageContainer">
            <div className='centeredImage' onMouseMove={handleMouse}>
                {/* somehow onMouseMove on canvas don't works */}
                <canvas ref={canvasRef}/>
                <div className='overlay' style={overlayPos(canvasSelections)}>
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