import React, { ReactNode, Ref, forwardRef, useContext, useEffect, useImperativeHandle, useRef, useState, useSyncExternalStore } from "react";
import GraphNode from "./GraphNode";
import ImportGraphNode from "./ImportGraphNode";
import TransformGraphNode from "./TransformGraphNode";
import { Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { connectionStoreContext, nodeStoreContext } from "../../stores/context";
import { faL, faTrash } from "@fortawesome/free-solid-svg-icons";
import { GUID } from "../../engine/nodeResponse";
import Edge from "./GraphEdge";
import GraphEdge from "./GraphEdge";


export interface GraphSpaceInterface{
    getDebugSpaceSize: ()=>{x:number, y:number},
    getSpaceRect: ()=>DOMRect|undefined
}

export default function GraphSpaceComponent({children=undefined, scale, offset}: {children?: ReactNode, scale: number, offset: {x: number, y: number}}, forwardedRef: Ref<GraphSpaceInterface>){

    const viewRef = useRef<HTMLDivElement>(null);
    const nodeContext = useContext(nodeStoreContext);
    const nodeCollection = useSyncExternalStore(nodeContext.subscribeNodeCollection.bind(nodeContext), nodeContext.getNodeCollection.bind(nodeContext));
    const connectionContext = useContext(connectionStoreContext);
    const connectionCollection = useSyncExternalStore(connectionContext.subscribeConnections.bind(connectionContext) as any, connectionContext.getConnections.bind(connectionContext));

    const [addingInputConnection, setAddingInputConnection] = useState(false);
    const [addingOutputConnection, setAddingOutputConnection] = useState(false);
    const [debSpaceSize, setDebSpaceSize] = useState({x:0, y:0})
    const [highlightedGUID, setHighlightedGUID] = useState("")
    const [connectionComponent, setConnectionComponent] = useState(handleConnections())


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

    //#region node MouseEvents
    // adding moving elements in space instead element wise, allows to controll z-index
    function dragStart(e: React.SyntheticEvent){
        // typescript type checking
        if(!(e.nativeEvent.target instanceof HTMLElement)) return;
        // TODO: check if this really do anything (yes, now it does)
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

    function handleConnections(){
        return connectionCollection.map(connInf => {
            const connDef = connInf.connectionDefinition;
            const guid0 = connDef[0][0];
            const guid1 = connDef[1][0];

            const pos0 = nodeContext.getNode(guid0)().value.getPos();
            const pos1 = nodeContext.getNode(guid1)().value.getPos();
            console.log(guid0, guid1);
            // for now top left corner connects to top left corner

            return <GraphEdge pos0={[pos0.x, pos0.y]} pos1={[pos1.x, pos1.y]} />
        })
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
                nodeContext.getNode(dragTarget.id)().value.setPos({x, y})
                // hacky, but works
                setConnectionComponent(handleConnections())
            }
        }
    }
    //#endregion
    //#region input/output MouseEvents
    let [addingGUID, setAddingGUID] = useState("");

    function connectionToggle(e: React.SyntheticEvent, myGUID: GUID){
        if(!(e.nativeEvent.target instanceof HTMLElement)) return;
        
        let closest = e.nativeEvent.target;
        if (!(closest instanceof HTMLElement)) return;
        console.log(closest.getBoundingClientRect())
        
        const input = closest.classList.contains("circle-top");

        if((addingInputConnection && input) || (addingOutputConnection && !input)){
            addingGUID = myGUID;
            return;
        }

        if(addingInputConnection && !input && addingGUID != myGUID){
            setAddingInputConnection(false);
            // TODO: connectionStore.addConnection(addingGUID, myGUID);
            console.log("added connection ", myGUID, " -> ", addingGUID);
            connectionContext.connectNodes([
                [myGUID, 1],
                [addingGUID, 1]
            ])
            return;
        }

        if(addingOutputConnection && input && addingGUID != myGUID){
            setAddingOutputConnection(false);
            // TODO: connectionStore.addConnection(myGUID, addingGUID);
            console.log("added connection ", addingGUID, " -> ", myGUID);
            connectionContext.connectNodes([
                [addingGUID, 1],
                [myGUID, 1]
            ])
            return;
        }

        setAddingInputConnection(input);
        setAddingOutputConnection(!input);
        setAddingGUID(myGUID);
    }

    //#endregion

    function handleTrashIcon(){
        nodeContext.removeTransform(highlightedGUID)
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
        
        {/* DEBUG: coordinates markers */}
        <div style={{position: 'absolute', top: "-2.5rem", left: "-1.5rem"}} className='debugSpaceOverlay'>0, 0</div>
        <div style={{position: 'absolute', top: "100%", left: "100%"}} className='debugSpaceOverlay'>{viewRef.current ? `${debSpaceSize.x}, ${debSpaceSize.y}` : ''}</div>
        <div style={{position: 'absolute', top: "-2.5rem", left: "100%"}} className='debugSpaceOverlay'>{viewRef.current ? `${debSpaceSize.x}, 0` : ''}</div>
        <div style={{position: 'absolute', top: "100%", left: "-1.5rem"}} className='debugSpaceOverlay'>{viewRef.current ? `0, ${debSpaceSize.y}` : ''}</div>
        
        {   
            // export interface ConnectionInfo{
            //     connectionDefinition: ConnectionDefinition
            //     display: CanvasArrow
            // }
            connectionComponent
            
        }


        {/* END DEBUG */}
        {
            nodeCollection.map(guid => {

                const trf = nodeContext.getNode(guid)().value;
                const style = guid == highlightedGUID ? {
                        borderStyle: "solid",
                        borderWidth: "3px",
                        borderColor: "blue"
                    } : {
                        borderWitdh: "0px"
                    }
                return trf.name == "source" ? 
                <ImportGraphNode guid={guid} style={style} onBodyClick={dragStart} ioFunction={connectionToggle}/> : 
                <TransformGraphNode guid={guid} style={style} onBodyClick={dragStart} ioFunction={connectionToggle}/>
            }
            )
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