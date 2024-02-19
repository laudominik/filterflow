import { forwardRef, useContext, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import './GraphSpace.css'
import { FilterStoreContext } from '../../stores/simpleFilterStore';
import GraphNode from './GraphNode';
import Grid from './Grid';
import { Button, ButtonGroup, ButtonToolbar } from 'react-bootstrap';
import { faCircleQuestion, faExpand, faMinus, faPlus, faQuestion, faQuestionCircle, faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import SearchPopup from './SearchPopup';
import {GraphSpace, GraphSpaceInterface} from './GraphSpace';

// exposing stuff based https://github.com/PaulLeCam/react-leaflet/blob/master/packages/react-leaflet/src/MapContainer.tsx
export default function GraphView(){
    const filterStore = useContext(FilterStoreContext);
    const gridRef = useRef<HTMLCanvasElement>(null);
    const graphSpaceRef = useRef<GraphSpaceInterface>(null);
    const nodes = useSyncExternalStore(filterStore.subscribeSequence.bind(filterStore), filterStore.getSequence.bind(filterStore));

    const [offset, setOffset] = useState({x:0, y:0});
    const [scale, setScale] = useState(1);
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
    
    function handleWheel(e: React.WheelEvent){
        if(e.ctrlKey){
            e.preventDefault()
            e.stopPropagation()
            
            
            const viewRect = graphSpaceRef.current?.getSpaceRect();

            let posX = e.pageX - viewRect!.x;
            let posY = e.pageY - viewRect!.y;
            
            let newScale = Math.pow(2,Math.log2(scale) + e.deltaY/1000)
            

            handleZoom(newScale/scale, [posX, posY])

        } else {
            e.preventDefault()
            e.stopPropagation()
            
            // TODO: 
            handlePan(e.deltaX, e.deltaY)
        }
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


    // TODO: make it generic, and reccurent (and clean)

    //? TODO: figure out if that's a good soultion, and if using canvas won't be better
    // TODO: handle move, by dragging element
    // TODO: make dummy graph nodes
    // TODO: add overlay (centering, and zoom controlls)
    return <div className='graphView' onWheel={handleWheel}>
        {/* TODO: set dynamic size?? */}
        <Grid displacement={[offset.x, offset.y]} scale={scale} size={[1920, 895]}/>
        {/* DEBUG: transformation info */}
        <div style={{position: 'absolute', top: "2em", left: "0.2vw"}} className='debugOverlay'>{`offset: ${offset.x}, ${offset.y}`}</div>
        <div style={{position: 'absolute', top: "4.6em", left: "0.2vw"}} className='debugOverlay'>{`scale: ${scale}`}</div>
        {/* END DEBUG */}
        <GraphSpace scale={scale} offset={offset} ref={graphSpaceRef}>
            <SearchPopup></SearchPopup>
        </GraphSpace>

        {/* TODO: change collor of this */}
        <div className='graphViewTooltip'>

        <Button title='view help'><FontAwesomeIcon icon={faQuestion}/></Button>
        <ButtonGroup vertical={true} >
            <Button title='auto zoom to content'><FontAwesomeIcon icon={faExpand}/></Button>
            <Button onClick={()=>{setScale(1); setOffset({x:0,y:0})}} title='reset to origin'><FontAwesomeIcon icon={faRotateLeft}/></Button>
        </ ButtonGroup>
        <ButtonGroup vertical={true} >
            <Button onClick={()=>{handleButtomZoom(3/2)}} title='zoom in'><FontAwesomeIcon icon={faPlus}/></Button>
            <Button onClick={()=>{handleButtomZoom(2/3)}} title='zoom out'><FontAwesomeIcon icon={faMinus}/></Button>
        </ButtonGroup>
        </div>
    </div>
}
