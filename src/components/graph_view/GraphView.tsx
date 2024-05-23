import {forwardRef, useContext, useEffect, useRef, useState, useSyncExternalStore} from 'react';
import './GraphSpace.css'
import {FilterStoreContext} from '../../stores/simpleFilterStore';
import GraphNode from './GraphNode';
import Grid from './Grid';
import {Button, ButtonGroup, ButtonToolbar} from 'react-bootstrap';
import {faCircleQuestion, faExpand, faMagnifyingGlassMinus, faMagnifyingGlassPlus, faMinus, faPlus, faQuestion, faQuestionCircle, faRotateLeft} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import SearchPopup from './SearchPopup';
import {GraphSpace, GraphSpaceInterface} from './GraphSpace';
import useWindowDimensions from '../../util/WindowDimensionHook';
import {useCommand} from '../../util/commands';
import ShortcutSheet from '../commands/ShotcutSheet';

// for some f*ckin reason, there's no constanst for button number.. 
// despite values being specified in standard
const MIDDLE_BUTTON = 1;

// exposing stuff based https://github.com/PaulLeCam/react-leaflet/blob/master/packages/react-leaflet/src/MapContainer.tsx
export default function GraphView() {
    const filterStore = useContext(FilterStoreContext);
    const gridRef = useRef<HTMLCanvasElement>(null);
    const rootRef = useRef<HTMLDivElement>(null);
    const graphSpaceRef = useRef<GraphSpaceInterface>(null);
    const nodes = useSyncExternalStore(filterStore.subscribeSequence.bind(filterStore), filterStore.getSequence.bind(filterStore));

    // TODO: make this use element size instead of screen size??
    // TODO: remove couping
    const [{width: viewWidth, height: viewHeight}, setViewSize] = useState({width: 0, height: 0});
    const [offset, setOffset] = useState({x: 0, y: 0});
    const [scale, setScale] = useState(1);
    const [isMoving, SetIsMoving] = useState(false);
    const [searchVisible, setSearchVisibiilty] = useState(false)
    const [searchPos, setSearchPos] = useState<[number, number]>([0, 0]);
    const [shortcutSheetVisible, setShortcutSheetVisible] = useState(false);

    useEffect(() => {
        function handleResize() {
            setViewSize(getViewSize());
        }

        window.addEventListener('resize', handleResize);
        setViewSize(getViewSize());
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    function getViewSize(): {width: number, height: number} {
        if (!rootRef.current) return {width: 0, height: 0}
        const rect = rootRef.current.getBoundingClientRect();
        return {width: rect.width, height: rect.height}
    }

    const toggleShortcuts = () => {
        setShortcutSheetVisible(!shortcutSheetVisible)
    }

    useCommand({
        name: "Add Node",
        binding: ["Shift", "A"],
        callback: handleOpenSearch
    })

    // TODO: fix this mess, something is wrong
    /**
 * 
 * @param value value to multiply current zoom
 * @param pivot 
 */
    function handleZoom(value: number, pivot: [number, number]) {

        let newScale = scale * value;
        newScale = Math.min(Math.max(newScale, 0.2), 5);

        setScale(newScale)

        let displacementX = pivot[0] - pivot[0] * (newScale / scale)
        let displacementY = pivot[1] - pivot[1] * (newScale / scale)
        handlePan(displacementX, displacementY)
    }

    function handlePan(x: number, y: number) {
        setOffset({x: offset.x + x, y: offset.y + y})
        handleSearchPos();
    }

    function handleSearchPos(position?: [number, number]) {
        if (position) {
            setSearchPos(position)
            return;
        }
        const {width, height} = getViewSize()
        setSearchPos([(-offset.x + width / 2) / scale, (-offset.y + height / 2) / scale])
    }

    function handleButtomZoom(value: number) {
        const viewRect = graphSpaceRef.current?.getSpaceRect();
        handleZoom(value, [viewRect!.width / 2, viewRect!.height / 2])
    }

    // offset is in real coordinates

    function handleWheel(event: React.WheelEvent) {
        if (event.ctrlKey) {
            event.preventDefault()
            event.stopPropagation()


            const viewRect = graphSpaceRef.current?.getSpaceRect();

            let posX = event.pageX - viewRect!.x;
            let posY = event.pageY - viewRect!.y;

            let newScale = Math.pow(2, Math.log2(scale) + event.deltaY / 1000)


            handleZoom(newScale / scale, [posX, posY])

        } else {
            event.preventDefault()
            event.stopPropagation()

            handlePan(event.deltaX, event.deltaY)
        }
    }

    function handleMouseDown(event: React.MouseEvent) {
        setSearchVisibiilty(false);
        if (event.button === MIDDLE_BUTTON) {
            // start move
            SetIsMoving(true);
        }
    }

    function handleMousePan(event: React.MouseEvent) {
        if (!isMoving) return;
        // TODO: replace with a global offset for more precision and better smoothness
        handlePan(event.movementX, event.movementY);
    }

    function handleMouseUp(event: React.MouseEvent) {
        // TODO: handle other methods of move (so, this should be updated)
        if (event.button === MIDDLE_BUTTON) {
            if (isMoving) {
                SetIsMoving(false);
            }
        }
    }

    function handleOpenSearch(position?: [number, number]) {
        handleSearchPos(position)
        setSearchVisibiilty(true);
    }
    // TODO: handle middle mouse click
    // TODO: handle touch pinch, and pan
    function handleKeyDown(event: React.KeyboardEvent) {
        // console.log()
    }

    // the trick to prevent CTRL+Wheel Zoom is to prevent it from root element
    // TODO: convert this to more React-ish solution
    useEffect(() => {
        const preventZoom = (e: WheelEvent) => {
            if (e.ctrlKey) {
                e.preventDefault();
            }
        }
        document.getElementById('root')?.addEventListener('wheel', preventZoom)
    })


    return <>
        <div className='graphView' onWheel={handleWheel} onKeyDown={handleKeyDown} onMouseDown={handleMouseDown} onMouseMove={handleMousePan} onMouseUp={handleMouseUp} ref={rootRef}>
            <Grid displacement={[offset.x, offset.y]} scale={scale} size={[viewWidth, viewHeight]} />
            {/* DEBUG: transformation info */}
            {/* <div style={{position: 'absolute', top: "1em", left: "0.2vw"}} className='debugOverlay'>{`screen size: ${viewWidth}, ${viewHeight}`}</div>
            <div style={{position: 'absolute', top: "3em", left: "0.2vw"}} className='debugOverlay'>{`search pos: ${searchPos[0]}, ${searchPos[1]}`}</div>
            <div style={{position: 'absolute', top: "5.6em", left: "0.2vw"}} className='debugOverlay'>{`scale: ${scale}`}</div> */}
            {/* END DEBUG */}

            <GraphSpace scale={scale} offset={offset} ref={graphSpaceRef}></GraphSpace>
            <SearchPopup visible={searchVisible} setVisible={setSearchVisibiilty} position={searchPos}></SearchPopup>

            <div className='graphViewTooltip'>
                <Button title="add transformation" onClick={(e) => {e.preventDefault(); e.stopPropagation(); handleOpenSearch()}}><FontAwesomeIcon icon={faPlus} /></Button>
                <Button title='view shortcuts' onClick={toggleShortcuts}><FontAwesomeIcon icon={faQuestion} /></Button>
                <ButtonGroup vertical={true} >
                    {/* <Button title='auto zoom to content'><FontAwesomeIcon icon={faExpand}/></Button> */}
                    <Button onClick={() => {setScale(1); setOffset({x: 0, y: 0})}} title='reset to origin'><FontAwesomeIcon icon={faRotateLeft} /></Button>
                </ ButtonGroup>
                <ButtonGroup vertical={true} >
                    <Button onClick={() => {handleButtomZoom(3 / 2)}} title='zoom in'><FontAwesomeIcon icon={faMagnifyingGlassPlus} /></Button>
                    <Button onClick={() => {handleButtomZoom(2 / 3)}} title='zoom out'><FontAwesomeIcon icon={faMagnifyingGlassMinus} /></Button>
                </ButtonGroup>
            </div>
        </div>
        <ShortcutSheet show={shortcutSheetVisible} setShow={setShortcutSheetVisible} />
    </>

}
