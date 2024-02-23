import { forwardRef, useContext, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import './GraphSpace.css'
import { FilterStoreContext } from '../../stores/simpleFilterStore';
import GraphNode from './GraphNode';
import Grid from './Grid';
import { Button, ButtonGroup, ButtonToolbar } from 'react-bootstrap';
import { faCircleQuestion, faExpand, faMagnifyingGlassMinus, faMagnifyingGlassPlus, faMinus, faPlus, faQuestion, faQuestionCircle, faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import SearchPopup from './SearchPopup';
import {GraphSpace, GraphSpaceInterface} from './GraphSpace';
import useWindowDimensions from '../../util/WindowDimensionHook';

// for some f*ckin reason, there's no constanst for button number.. 
// despite values being specified in standard
const MIDDLE_BUTTON = 1;

// exposing stuff based https://github.com/PaulLeCam/react-leaflet/blob/master/packages/react-leaflet/src/MapContainer.tsx
export default function GraphView(){
    const filterStore = useContext(FilterStoreContext);
    const gridRef = useRef<HTMLCanvasElement>(null);
    const rootRef = useRef<HTMLDivElement>(null);
    const graphSpaceRef = useRef<GraphSpaceInterface>(null);
    const nodes = useSyncExternalStore(filterStore.subscribeSequence.bind(filterStore), filterStore.getSequence.bind(filterStore));

    // TODO: make this use element size instead of screen size??
    // TODO: remove couping
    const [{width: viewWidth, height: viewHeight}, setViewSize] = useState({width:0, height:0});
    const [offset, setOffset] = useState({x:0, y:0});
    const [scale, setScale] = useState(1);
    const [isMoving, SetIsMoving] = useState(false);
    const [searchVisible, setSearchVisibiilty] = useState(false)


    useEffect(() => {
        function handleResize() {
            setViewSize(getViewSize());
        }
    
        window.addEventListener('resize', handleResize);
        setViewSize(getViewSize());
        return () => window.removeEventListener('resize', handleResize);
      }, []);

    function getViewSize(): {width: number, height: number}{
        if(!rootRef.current) return {width: 0, height: 0}
        const rect = rootRef.current.getBoundingClientRect();
        return {width: rect.width, height: rect.height}
    }

    // TODO: fix this mess, something is wrong
    /**
 * 
 * @param value value to multiply current zoom
 * @param pivot 
 */
    function handleZoom(value: number, pivot: [number, number]){

        let newScale = scale * value;
        newScale = Math.min(Math.max(newScale,0.2),5);

        setScale(newScale)

        let displacementX = pivot[0] - pivot[0]*(newScale/scale)
        let displacementY = pivot[1] - pivot[1]*(newScale/scale)
        handlePan(displacementX, displacementY)
    }

    function handlePan(x:number, y:number){
        setOffset({x: offset.x + x, y: offset.y + y})
    }

    function handleButtomZoom(value: number){
        const viewRect = graphSpaceRef.current?.getSpaceRect();
        handleZoom(value, [viewRect!.width/2, viewRect!.height/2])
    }

    // offset is in real coordinates
    
    function handleWheel(event: React.WheelEvent){
        if(event.ctrlKey){
            event.preventDefault()
            event.stopPropagation()
            
            
            const viewRect = graphSpaceRef.current?.getSpaceRect();

            let posX = event.pageX - viewRect!.x;
            let posY = event.pageY - viewRect!.y;
            
            let newScale = Math.pow(2,Math.log2(scale) + event.deltaY/1000)
            

            handleZoom(newScale/scale, [posX, posY])

        } else {
            event.preventDefault()
            event.stopPropagation()
            
            handlePan(event.deltaX, event.deltaY)
        }
    }

    function handleMouseDown(event : React.MouseEvent){

        if(event.button === MIDDLE_BUTTON){
            // start move
            SetIsMoving(true);
        }
    }

    function handleMousePan(event : React.MouseEvent){
        if(!isMoving) return;
        // TODO: replace with a global offset for more precision and better smoothness
        handlePan(event.movementX, event.movementY);
    }

    function handleMouseUp(event : React.MouseEvent){
        // TODO: handle other methods of move (so, this should be updated)
        if(event.button === MIDDLE_BUTTON){
            if(isMoving){
                SetIsMoving(false);
            }
        }
    }

    // TODO: add handle by shortcut???
    function handleOpenSearch(position?: [number, number]){
        // set visibility,
        // set position
        if(!position){
            let rect = graphSpaceRef.current?.getSpaceRect();
            position = [rect!.width/2, rect!.height/2]
        }
        setSearchVisibiilty(true);

    }
    // TODO: handle middle mouse click
    // TODO: handle touch pinch, and pan
    function handleKeyDown(event: React.KeyboardEvent){
        console.log()
    }

    function handleClick(event: React.SyntheticEvent){
        setSearchVisibiilty(false)
    }

    // the trick to prevent CTRL+Wheel Zoom is to prevent it from root element
    // TODO: convert this to more React-ish solution
    useEffect(()=>{
        document.getElementById('root')?.addEventListener('wheel', (e: WheelEvent)=>{
            if(e.ctrlKey){
                e.preventDefault();
            }
        })
    })


    // TODO: handle move, by dragging element
    return <div className='graphView' onWheel={handleWheel} onKeyDown={handleKeyDown} onClick={handleClick} onMouseDown={handleMouseDown} onMouseMove={handleMousePan} onMouseUp={handleMouseUp} ref={rootRef}>
        {/* TODO: set dynamic size?? */}
        <Grid displacement={[offset.x, offset.y]} scale={scale} size={[viewWidth, viewHeight]}/>
        {/* DEBUG: transformation info */}
        <div style={{position: 'absolute', top: "1em", left: "0.2vw"}} className='debugOverlay'>{`screen size: ${viewWidth}, ${viewHeight}`}</div>
        <div style={{position: 'absolute', top: "3em", left: "0.2vw"}} className='debugOverlay'>{`offset: ${offset.x}, ${offset.y}`}</div>
        <div style={{position: 'absolute', top: "5.6em", left: "0.2vw"}} className='debugOverlay'>{`scale: ${scale}`}</div>
        {/* END DEBUG */}
        <svg id="arrows" className="arrows">
            <defs>
                {/* from https://webgl2fundamentals.org/webgl/lessons/resources/webgl-state-diagram.html#no-help */}
                <marker id="hsl-260--100---80--" viewBox="0 0 10 10" refX="3" refY="5" markerWidth="6" markerHeight="6" orient="auto" fill="hsl(260, 100%, 80%)"><path d="M 0 0 L 10 5 L 0 10 z"></path></marker>
                <marker id="hsl-190--100---80--" viewBox="0 0 10 10" refX="3" refY="5" markerWidth="6" markerHeight="6" orient="auto" fill="hsl(190, 100%, 80%)"><path d="M 0 0 L 10 5 L 0 10 z"></path></marker>
                <marker id="hsl-95--100---80--" viewBox="0 0 10 10" refX="3" refY="5" markerWidth="6" markerHeight="6" orient="auto" fill="hsl(95, 100%, 80%)"><path d="M 0 0 L 10 5 L 0 10 z"></path></marker>
            </defs>
            <g fill="none" stroke="hsl(260, 100%, 80%)" strokeWidth={2} markerEnd="url(#hsl-260--100---80--)">
                <path d={`M${offset.x - 347},${offset.y+198.5} C${offset.x + 447},${offset.y + 198.5} ${offset.x + 471},${offset.y + 20.5} ${offset.x + 571},${offset.y + 20.5}`}></path>
            </g>
        </svg>
        <GraphSpace scale={scale} offset={offset} ref={graphSpaceRef}></GraphSpace>
        <SearchPopup visible={searchVisible}></SearchPopup>
        {/* TODO: change collor of this */}
        <div className='graphViewTooltip'>
        <Button title="add transformation" onClick={(e)=>{e.preventDefault(); e.stopPropagation(); handleOpenSearch()}}><FontAwesomeIcon icon={faPlus}/></Button>
        <Button title='view help'><FontAwesomeIcon icon={faQuestion}/></Button>
        <ButtonGroup vertical={true} >
            <Button title='auto zoom to content'><FontAwesomeIcon icon={faExpand}/></Button>
            <Button onClick={()=>{setScale(1); setOffset({x:0,y:0})}} title='reset to origin'><FontAwesomeIcon icon={faRotateLeft}/></Button>
        </ ButtonGroup>
        <ButtonGroup vertical={true} >
            <Button onClick={()=>{handleButtomZoom(3/2)}} title='zoom in'><FontAwesomeIcon icon={faMagnifyingGlassPlus}/></Button>
            <Button onClick={()=>{handleButtomZoom(2/3)}} title='zoom out'><FontAwesomeIcon icon={faMagnifyingGlassMinus}/></Button>
        </ButtonGroup>
        </div>
    </div>
}
