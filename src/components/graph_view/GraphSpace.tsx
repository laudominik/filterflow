import { ReactNode, Ref, forwardRef, useContext, useEffect, useImperativeHandle, useRef, useState, useSyncExternalStore } from "react";
import GraphNode from "./GraphNode";
import { graphContext } from "../../stores/graphFilterStore";
import ImportGraphNode from "./ImportGraphNode";
import TransformGraphNode from "./TransformGraphNode";
import { Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";


export interface GraphSpaceInterface{
    getDebugSpaceSize: ()=>{x:number, y:number},
    getSpaceRect: ()=>DOMRect|undefined
}

export default function GraphSpaceComponent({children, scale, offset}: {children: ReactNode, scale: number, offset: {x: number, y: number}}, forwardedRef: Ref<GraphSpaceInterface>){

    const viewRef = useRef<HTMLDivElement>(null);
    const graphStore = useContext(graphContext);
    const nodeCollection = useSyncExternalStore(graphStore.subscribeNodeCollection.bind(graphStore), graphStore.getNodeCollection.bind(graphStore));
    const [debSpaceSize, setDebSpaceSize] = useState({x:0, y:0})
    const [highlightedGUID, setHighlightedGUID] = useState("")


    useImperativeHandle(forwardedRef, () =>{
        return {
            getDebugSpaceSize(){
                return debSpaceSize
            },
            getSpaceRect(): DOMRect|undefined{
                return viewRef.current?.getBoundingClientRect();
            }
        }
    }, [debSpaceSize]);

    let dragTarget : HTMLElement | undefined = undefined;
    let dragMouseStartX = 0;
    let dragMouseStartY = 0;
    let dragTargetStartX = 0 , dragTargetStartY = 0;
    let dragDistance = 0;

    //#region MouseEvents
    // adding moving elements in space instead element wise, allows to controll z-index
    function dragStart(e: React.SyntheticEvent){
        // typescript type checking
        if(!(e.nativeEvent.target instanceof HTMLElement)) return;
        // TODO: check if this really do anything
        let closest = e.nativeEvent.target.closest('.draggable');
        if (!(closest instanceof HTMLElement)) return;
        

        e.preventDefault();
        e.stopPropagation();

        // https://github.com/grafana/grafana/pull/79508/files#diff-0713145d1754d5f4b090224a1d1cdf818fe5cbdcc23c8d3aabff8fb82bf2f6baR186-R190
        const isTouch = (e.nativeEvent as TouchEvent).changedTouches && e.nativeEvent instanceof TouchEvent;
        if((e.nativeEvent as TouchEvent).changedTouches && e.nativeEvent instanceof TouchEvent){
            dragMouseStartX = e.nativeEvent.touches[0].pageX
            dragMouseStartY = e.nativeEvent.touches[0].pageY
        } else{
            dragMouseStartX = (e.nativeEvent as MouseEvent).pageX
            dragMouseStartY = (e.nativeEvent as MouseEvent).pageY
        }
        
        // get real position
        dragMouseStartX = dragMouseStartX / scale - offset.x
        dragMouseStartY = dragMouseStartY / scale - offset.y

        dragDistance = 0;

        dragTarget = closest;

        const rect = dragTarget?.getBoundingClientRect();
        const viewRect = viewRef.current?.getBoundingClientRect();

        // this results in real position
        dragTargetStartX = rect ? (window.scrollX + (rect.left - viewRect!.x)/scale) : 0;
        dragTargetStartY = rect ? (window.scrollY + (rect.top - viewRect!.y)/scale) : 0;
        // move to front
        if(dragTarget){
            setHighlightedGUID(dragTarget.id)
        }
        
        window.addEventListener(isTouch ? 'touchmove' : 'mousemove', dragMove, {passive: false});
        window.addEventListener(isTouch ? 'touchend' : 'mouseup', dragStop, {passive: false});
    }

    function dragStop(e: MouseEvent | TouchEvent){
        if(dragTarget){
            e.preventDefault();
            e.stopPropagation();

            const isTouch = (e as TouchEvent).changedTouches && e instanceof TouchEvent;
            
            dragTarget.classList.remove('dragging');
            dragTarget = undefined
            
            // dragging is a rare event, so it won't be too much overhead
            window.removeEventListener(isTouch ? 'touchmove' : 'mousemove', dragMove)
            window.removeEventListener(isTouch ? 'touchend' : 'mouseup', dragStop)

            // we are forcing to drag by default, handle tap
            if(isTouch && dragDistance === 0){
                const clickElem = document.elementFromPoint(dragMouseStartX, dragMouseStartY);
                clickElem?.dispatchEvent(new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    clientX: dragMouseStartX,
                    clientY: dragMouseStartY
                }))
            }
        }
    }

    function dragMove(e: MouseEvent | TouchEvent){
        if(dragTarget){
            e.preventDefault();
            e.stopPropagation();           
            
            const isTouch = (e as TouchEvent).changedTouches && e instanceof TouchEvent;
            const vx = (isTouch ? e.touches[0].pageX : (e as MouseEvent).pageX);
            const vy = (isTouch ? e.touches[0].pageY : (e as MouseEvent).pageY)
            const dx = (vx/scale - offset.x - dragMouseStartX)
            const dy = (vy/scale - offset.y - dragMouseStartY)
            dragDistance += dx + dy;
            const x = dragTargetStartX + dx;
            const y = dragTargetStartY + dy;
            
            dragTarget.style.left = `${x}px`;
            dragTarget.style.top = `${y}px`;
            if(nodeCollection.includes(dragTarget.id)){
                graphStore.getNode(dragTarget.id).value.setPos({x, y})
            }
        }
    }
    //#endregion

    function handleTrashIcon(){
        graphStore.removeTransform(highlightedGUID)
        setHighlightedGUID("")
    }

    useEffect(() => {
        if(viewRef.current){
            const rect = viewRef.current.getBoundingClientRect()
            setDebSpaceSize({x: Math.round(rect.width / scale), y: Math.round(rect.height / scale)})
        }
    }, [scale])

    return <>
    <div className="graphSpace" ref={viewRef} style={{transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, outline: "1px solid green"}}>
        {/* a gnome here represent a plank size */}
        <div onMouseDown={dragStart} className='draggable' style={{backgroundImage: 'url(filterflow/gnome.webp)', backgroundSize:"0.0085px 0.0085px", width: "0.0085px", height: "0.0085px", top:"-0.0085px"}}/>
        {/* TODO: add render elements */}
        {/* DEBUG: coordinates markers */}
        <div style={{position: 'absolute', top: "-2.5rem", left: "-1.5rem"}} className='debugSpaceOverlay'>0, 0</div>
        <div style={{position: 'absolute', top: "100%", left: "100%"}} className='debugSpaceOverlay'>{viewRef.current ? `${debSpaceSize.x}, ${debSpaceSize.y}` : ''}</div>
        <div style={{position: 'absolute', top: "-2.5rem", left: "100%"}} className='debugSpaceOverlay'>{viewRef.current ? `${debSpaceSize.x}, 0` : ''}</div>
        <div style={{position: 'absolute', top: "100%", left: "-1.5rem"}} className='debugSpaceOverlay'>{viewRef.current ? `0, ${debSpaceSize.y}` : ''}</div>
        {/* END DEBUG */}
        {
            nodeCollection.map(guid => {

                const trf = graphStore.getNode(guid).value;
                const style = guid == highlightedGUID ? {
                    left: trf.getPos().x, 
                    top: trf.getPos().y,
                    borderStyle: "dashed",
                    borderWidth: "10px",
                    borderColor: "red"
                } : {
                    left: trf.getPos().x, 
                    top: trf.getPos().y,
                    borderWitdh: "0px"
                }
                const draggable = <div onMouseDown={dragStart} className='draggable' id={guid} style={style}>
                {
                    trf.name == "source" ? <ImportGraphNode guid={guid} /> :  <TransformGraphNode guid={guid} />
                }
                </div>

                return draggable
            })
        }
        
        {children}
        </div>
    {highlightedGUID ? 
        <div className='nodeContextMenu'>
            GUID: {highlightedGUID} <Button onClick={handleTrashIcon}><FontAwesomeIcon icon={faTrash}/></Button>
        </div>
     : <></>}
    </>
    
}

export const GraphSpace = forwardRef(GraphSpaceComponent);