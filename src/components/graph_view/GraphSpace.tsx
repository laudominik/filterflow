import React, {ChangeEvent, ReactNode, Ref, createContext, forwardRef, useCallback, useContext, useEffect, useImperativeHandle, useMemo, useRef, useState, useSyncExternalStore} from "react";
import {Button, Form} from "react-bootstrap";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {connectionStoreContext, nodeStoreContext, notebookStoreContext, persistenceContext, previewStoreContext} from "../../stores/context";
import {faAnkh, faComment, faCommentDots, faDoorClosed, faDoorOpen, faImagePortrait, faL, faTrash} from "@fortawesome/free-solid-svg-icons";
import {GUID} from "../../engine/nodeResponse";
import GraphEdge, {NewEdge} from "./GraphEdge";
import GraphPreview from "./GraphPreview";
import {PreviewStore} from "../../stores/previewStore";
import SourceTransform from "../../engine/transforms/SourceTransform";
import GraphNode, { GraphNodeEvents, NodePointerEvent } from "./GraphNode";
import TransformGraphNode from "./TransformGraphNode";
import Transform from "../../engine/Transform";
import { useCommand } from "../../util/commands";
import { ConnectionDefinition, ConnectionInfo, ConnectionSide } from "../../stores/storeInterfaces";
import { ScaleOffsetContext } from "./GraphView";
import { IOType } from "../../engine/node";


export interface GraphSpaceInterface {
    getDebugSpaceSize: () => {x: number, y: number},
    getSpaceRect: () => DOMRect | undefined
}

export const selectedNodesContext = createContext<GUID[]>([]);

type selectedIOType = {type: IOType, guid: string, no: number}|undefined;
export const selectedIOContext = createContext<selectedIOType>(undefined);

// the best approach
// this gives full accessability; with a cost of coupling to node/preview content
//      pointerdown - moves the component
//          you set `pointerdown` in content to `stopPropagation` this stops component from dragging, and bugs
                // set this prop for buttons, inputs, comboboxes
//      pointerdowncapture - this handles selecting stuff; it ignores `pointerdown` and always allow for selection
// you fucking don't use `setPointerCapture` this shit made me spend 4+ hours on debugging
//      like, each browser has it's own bechaviour (+ depending on input type!)
//      insted; old good `window.addEventListener`, within `useEffect` (to keep reference, and remove the old listener)
// that's fucking it.. enjoy your UI! 

export default function GraphSpaceComponent({children = undefined}: {children?: ReactNode}, forwardedRef: Ref<GraphSpaceInterface>) {

    const {scale, offset} = useContext(ScaleOffsetContext);
    const viewRef = useRef<HTMLDivElement>(null);

    const previewContext = useContext(previewStoreContext);
    const openedPreviews = useSyncExternalStore(previewContext.subscribePreviews.bind(previewContext) as any, previewContext.getPreviews.bind(previewContext))

    const [debSpaceSize, setDebSpaceSize] = useState({x: 0, y: 0})
    const nodeContext = useContext(nodeStoreContext)
    const nodeCollection = useSyncExternalStore(nodeContext.subscribeNodeCollection.bind(nodeContext), nodeContext.getNodeCollection.bind(nodeContext));
    const nodeTransforms = useMemo(()=>{
        return nodeCollection.reduce((acc, guid)=>{return (acc[guid] = nodeContext.getNode(guid)().value, acc)}, {} as Record<string, Transform>)
    }, [nodeCollection, nodeContext])

    const connectionContext = useContext(connectionStoreContext)
    const connectionCollection = useSyncExternalStore(connectionContext.subscribeConnections.bind(connectionContext) as any, connectionContext.getConnections.bind(connectionContext));

    const [selected, setSelected] = useState<GUID[]>([])
    const [nodePos, setNodePos] = useState<Record<GUID, [number, number]>>({})
    const [selectedIO, setSelectedIO] = useState<{type: IOType, guid: string, no: number}>()
    const [distanceMoved, ] = useState({distance: 0});

    const [pointerStart, setPointerStart] = useState<{cursorStartingPos: [number, number], nodeStartingPos: Record<string,[number, number]>, isDragging: boolean}>({
        cursorStartingPos: [0,0],
        nodeStartingPos: {},
        isDragging: false
    })

    useEffect(()=>{
        setNodePos(
            nodeCollection.reduce((acc, guid)=>{
                const pos = nodeTransforms[guid].getPos();
                return (acc[guid] = [pos.x, pos.y], acc)
            }, {} as Record<string, [number,number]>)
        )
        setSelected(v => v.filter(l => nodeCollection.includes(l)))

    }, [nodeCollection, nodeTransforms])

    function deleteNode(guid: GUID) {
        previewContext.removePreviewStore(guid);
        nodeContext.removeTransform(guid);
    }

    function handleDelete() {
        if (selected.length === 0) return;

        selected.forEach(guid => {
            deleteNode(guid);
        });
    }

    function handleSpaceClick() {
        setSelected([]);
    }

    useCommand({
        name: "Delete selected",
        binding: ['Delete'],
        callback: handleDelete,
        dependencies: [selected]
    })

    function handleUnselect(){
        setSelected([])
        setSelectedIO(undefined)
    }

    useCommand({
        name: "Unselect",
        binding: ['Escape'],
        callback: handleUnselect,
    })

    const nodePointerDown =  useCallback<NodePointerEvent>((e: React.MouseEvent, node : Transform, guid : GUID) => {
        setPointerStart({
            cursorStartingPos: [(e.pageX - offset[0])/scale, (e.pageY- offset[1])/scale],
            isDragging: true,
            nodeStartingPos: {...nodePos}
        })
        distanceMoved.distance = 0;

        // (this logic - selection will be moved into `pointerdowncapture`)
        const isSelected = selected.includes(guid);
        if(e.ctrlKey){
            if(isSelected) setSelected(v => v.filter(l => l !== guid))
            else setSelected(v => [...v, guid])
        }
        else if(!isSelected){
            setSelected([guid])
        }
        e.preventDefault();
        e.stopPropagation();
    }, [offset, scale, selected, nodePos, distanceMoved]);

    useEffect(()=> {
        const nodePointerMove =  (e: MouseEvent) => {
            if(!pointerStart.isDragging) return;
            
            const dx = ((e.pageX - offset[0])/ scale - pointerStart.cursorStartingPos[0])
            const dy = ((e.pageY - offset[1]) / scale - pointerStart.cursorStartingPos[1])
            
            distanceMoved.distance += dx + dy;
            
            const nodePositions = {...pointerStart.nodeStartingPos};
            selected.forEach(guid => {
                if(nodePositions[guid]){
                const prevPos = nodePositions[guid];
                const newPos: [number, number] = [prevPos[0]+dx, prevPos[1]+dy]
                // intentional, to prevent re-renders, while keeping state between re-renders
                nodePos[guid] = newPos
                nodeTransforms[guid].setPos({x: newPos[0], y: newPos[1]})
                
                // note, this will be a component specific implementation
                const el = document.getElementById("node-"+guid);
                if(el){
                    el.style.left = newPos[0] + "px";
                    el.style.top = newPos[1] + "px";
                }
            }});

            e.preventDefault();
            e.stopPropagation();
        };

        const nodePointerUp = (e : PointerEvent) => {
            if(!pointerStart.isDragging) return;
            setPointerStart({
                cursorStartingPos: [(e.pageX - offset[0])/scale, (e.pageY - offset[1])/scale],
                isDragging: false,
                nodeStartingPos: {}
            })
    
            e.preventDefault();
            e.stopPropagation();
        } 

        window.addEventListener("pointermove", nodePointerMove);
        window.addEventListener("pointerup", nodePointerUp)

        return ()=>{
            window.removeEventListener("pointermove", nodePointerMove);
            window.removeEventListener("pointerup", nodePointerUp);
        }
    }, [distanceMoved, nodePos, nodeTransforms, offset, pointerStart, scale, selected])

    //* bad, naming; converted into MVP preview drag events
    const draggablePointerDown = (e: React.PointerEvent, guid: GUID) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        const node = nodeContext.getNode(guid)();

        setPointerStart({
            cursorStartingPos: [(e.pageX - offset[0])/scale, (e.pageY- offset[1])/scale],
            isDragging: true,
            nodeStartingPos: {"":[node.value.prevPos.x, node.value.prevPos.y]}
        })
        distanceMoved.distance = 0;
        e.stopPropagation();
        e.preventDefault();
    }

    const draggablePointerMove = (e: React.PointerEvent, guid: GUID) => {
        if(!pointerStart.isDragging) return;
        const node = nodeContext.getNode(guid)();

        const dx = ((e.pageX - offset[0])/ scale - pointerStart.cursorStartingPos[0])
        const dy = ((e.pageY - offset[1]) / scale - pointerStart.cursorStartingPos[1])

        distanceMoved.distance += dx + dy;

        const x = pointerStart.nodeStartingPos[""][0] + dx
        const y = pointerStart.nodeStartingPos[""][1] + dy;
        
        node.value.setPreviewPos({x, y});

        // set raw HTML, so we don't have to force re-render
        (e.currentTarget as HTMLElement).style.top = `${y}px`;
        (e.currentTarget as HTMLElement).style.left = `${x}px`;
        e.stopPropagation();
        e.preventDefault();
    }

    const draggablePointerUp = (e: React.PointerEvent) => {

        setPointerStart({
            cursorStartingPos: [(e.pageX - offset[0])/scale, (e.pageY - offset[1])/scale],
            isDragging: false,
            nodeStartingPos: {}
        })

        e.stopPropagation();
        e.preventDefault();
    }

    useImperativeHandle(forwardedRef, () => {
        return {
            getDebugSpaceSize() {
                return debSpaceSize
            },
            getSpaceRect(): DOMRect | undefined {
                return viewRef.current?.getBoundingClientRect();
            }
        }
    }, [debSpaceSize]);

    function handlePreviewConnections() {
        return Array.from(openedPreviews.keys()).map(guid => <NewEdge 
            handlesId={{src: `node-${guid}`, dst: `pr-${guid}`}} 
            observables={{deep: [`node-${guid}`, `pr-${guid}`], shallow: ["graphSpace"]}}
            style={{stroke: "orange", strokeWidth: 1, strokeDasharray: "10,5"}}
        />)
    }

    function handleIOClick(e : React.PointerEvent, type: IOType, guid: GUID, IOno: number) {
        if(selectedIO){

            const connection : ConnectionDefinition = selectedIO.type === "output" ? [[selectedIO.guid, selectedIO.no], [guid, IOno]] : [[guid,IOno], [selectedIO.guid, selectedIO.no]]
            connectionContext.connectNodes(connection);
            setSelectedIO(undefined);
        } else {
            setSelectedIO({type: type, guid: guid, no: IOno})
        }
    }


    //#endregion


    useEffect(() => {
        if (viewRef.current) {
            const rect = viewRef.current.getBoundingClientRect()
            setDebSpaceSize({x: Math.round(rect.width / scale), y: Math.round(rect.height / scale)})
        }
    }, [scale])

    //* this is the future implementation
    // const graphConnection = useMemo(()=>
    //     <GraphEdgeCollection edgeCollection={connectionCollection} selected={[]} edgeEvents={{}}/>
    // ,[connectionCollection])

    const graphConnection = <GraphEdgeCollection edgeCollection={connectionCollection} selected={[]} edgeEvents={{}}/>;

    return <>
        <selectedIOContext.Provider value={selectedIO}>
        <selectedNodesContext.Provider value={selected}>

            <div id="graphSpace" className="graphSpace" ref={viewRef} style={{transform: `translate(${offset[0]}px, ${offset[1]}px) scale(${scale})`, outline: "1px solid green"}} onPointerDown={handleSpaceClick}>
                {/* a gnome here represent a plank size */}
                {graphConnection}
                {/* DEBUG: coordinates markers */}
                <div style={{position: 'absolute', top: "-2.5rem", left: "-1.5rem"}} className='debugSpaceOverlay'>0, 0</div>
                <div style={{position: 'absolute', top: "100%", left: "100%"}} className='debugSpaceOverlay'>{viewRef.current ? `${debSpaceSize.x}, ${debSpaceSize.y}` : ''}</div>
                <div style={{position: 'absolute', top: "-2.5rem", left: "100%"}} className='debugSpaceOverlay'>{viewRef.current ? `${debSpaceSize.x}, 0` : ''}</div>
                <div style={{position: 'absolute', top: "100%", left: "-1.5rem"}} className='debugSpaceOverlay'>{viewRef.current ? `0, ${debSpaceSize.y}` : ''}</div>
                {/* END DEBUG */}

                {/* the NodeCollection will update _all nodes_ on: node select, node move, and node collection update //* this approach seems to be optimal for less than 100 node collections*/}
                {
                    handlePreviewConnections()
                }
                <NodeCollection 
                    nodeCollection={nodeCollection} 
                    selected={selected} 
                    dragging={pointerStart.isDragging}
                    nodeEvents={{onPointerDown: nodePointerDown}}
                    ioEvents={{onPointerDown: handleIOClick, onPointerUp: handleIOClick}}
                    />
                {
                    Array.from(openedPreviews.keys()).map(guid => 
                        <GraphPreview guid={guid} key={guid} pointerEvents={{onPointerDown: draggablePointerDown, onPointerMove: draggablePointerMove, onPointerUp: draggablePointerUp}}/>
                    )
                }
                {
                    selectedIO ? 
                    <NewEdge handlesId={{
                        src: `${selectedIO.type}-${selectedIO.guid}-${selectedIO.no}`, 
                        dst: "pointer-follower"}}
                        observables={{
                            deep: [`node-${selectedIO.guid}`],
                            shallow: ["pointer-follower", "graphSpace"]
                        }}
                        />
                        :
                        <></>
                    }
                <PointerFollower id="pointer-follower"/>
                {children}
            </div>
            <ContextToolbar/>
        </selectedNodesContext.Provider>
        </selectedIOContext.Provider>
    </>
}

const ContextToolbar = () => {
    const selectedNodes = useContext(selectedNodesContext);
    const nodeStore = useContext(nodeStoreContext);

    const previewStore = useContext(previewStoreContext);
    const openedPreviews = previewStore.getPreviews();
    const nodesWithPreview = Array.from(openedPreviews.keys());

    // const selectedWithoutPreview = selectedNodes.filter(guid => nodesWithPreview.includes(guid) === false)
    // const selectedWithPreview = selectedNodes.filter(guid => nodesWithPreview.includes(guid) === true)

    const handleDelete = () => {
        selectedNodes.forEach((guid)=> {
            previewStore.removePreviewStore(guid);
            nodeStore.removeTransform(guid)
        })
    }

    const handleOpenPreview = () => {
            selectedNodes.forEach(guid => {
                if(!previewStore.getPreviewStore(guid)){
                    previewStore.addPreviewStore(guid, [], guid);
                }
                previewStore.getPreviewStore(guid)?.updateContext([], "", false);
            })
    }

    const handleOpenVisualization = () => {
        selectedNodes.forEach(guid => {
            if(!previewStore.getPreviewStore(guid)){
                previewStore.addPreviewStore(guid, [], guid);
            }
            previewStore.getPreviewStore(guid)?.updateContext([], "", true);
        })
    }

    return <div className="nodeContextMenu">
        {selectedNodes.length > 0 && <Button title="delete selected" key={"delete"} onClick={handleDelete}><FontAwesomeIcon icon={faTrash} /></Button>}
        {selectedNodes.length > 0 && <Button title="open previews for selected" key={"open-preview"} onClick={handleOpenPreview}><FontAwesomeIcon icon={faDoorClosed} /></Button>}
        {selectedNodes.length > 0 && <Button title="open visualizations for selected" key={"open-visualization"} onClick={handleOpenVisualization}><FontAwesomeIcon icon={faComment} /></Button>}
    </div>
}

const PointerFollower = ({id}:{id : string})=> {
    const {scale, offset} = useContext(ScaleOffsetContext);
    const [pointerPos, setPointerPos] = useState([0,0]);
    useEffect(()=>{
        const mouseHandler = (e : PointerEvent)=>{setPointerPos([(e.pageX - offset[0])/scale, (e.pageY - offset[1])/scale])};
        window.addEventListener("pointermove", mouseHandler)
        return () => {window.removeEventListener("pointermove", mouseHandler)}
    }, [scale, offset])

    return <div id={id} style={{position: "absolute", pointerEvents: "none", top: pointerPos[1], left: pointerPos[0]}}>
    </div>
}

// @tad1: (the color will be dynamicly choosed, based on category, but later)
const NodeCollection = ({selected, dragging, ioEvents, nodeCollection, nodeEvents} : {selected: GUID[], dragging?: boolean, nodeCollection: GUID[]} & GraphNodeEvents) => {
    return <>
    {nodeCollection.map(guid => {
        return <TransformGraphNode className={(selected.includes(guid) ? "selectedNode " : "") + (dragging ? "dragging " : "")} key={guid} guid={guid}
        nodeEvents={nodeEvents} ioEvents={ioEvents}/>
    })}
    </>
}


const GraphEdgeCollection = ({selected, edgeCollection, edgeEvents} : {selected: GUID[], edgeCollection: ConnectionInfo[], edgeEvents : {}}) => {
    return <>
    {edgeCollection.map((connection, i) => {
        return <NewEdge handlesId={{
            src: `output-${connection.connectionDefinition[0][0]}-${connection.connectionDefinition[0][1]}`,
            dst: `input-${connection.connectionDefinition[1][0]}-${connection.connectionDefinition[1][1]}`
        }} observables={{
            deep: [`node-${connection.connectionDefinition[0][0]}`, `node-${connection.connectionDefinition[1][0]}`],
            shallow: ['graphSpace']
        }} key={i}/>
    })}
    </>
}




function NodeContextMenu({highlightedGUID,
    handleNodeTrashIcon,
    handleNodePreviewIcon,
    handleNodeVisualizationIcon,
    previewOpen}
    : {
        highlightedGUID: GUID,
        handleNodeTrashIcon: () => void,
        handleNodePreviewIcon: () => void,
        handleNodeVisualizationIcon: () => void,
        previewOpen: boolean
    }) {

    const nodeContext = useContext(nodeStoreContext);
    const node = useSyncExternalStore(nodeContext.subscribeNode(highlightedGUID), nodeContext.getNode(highlightedGUID));

    const previewContext = useContext(previewStoreContext);
    let previewStore = previewContext.getPreviewStore(highlightedGUID)
    if (!previewStore) {
        previewStore = new PreviewStore([], "")
    }
    const context = useSyncExternalStore(previewStore?.subscribeContext.bind(previewStore) as any, previewStore?.getContext.bind(previewStore) as any)

    const previewIcon = <FontAwesomeIcon icon={previewOpen ? faDoorClosed : faDoorOpen} />
    const visualizationIcon = <FontAwesomeIcon icon={previewStore && previewStore.getContext().visualizationEnabled ? faComment : faCommentDots} />
    const chooseImageIcon = <FontAwesomeIcon icon={faImagePortrait} />

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            nodeContext.updateParam(highlightedGUID, {image: event.target?.result as string})
            const src = nodeContext.getNode(highlightedGUID)().value as SourceTransform
            src.loadImage()
        }

        reader.readAsDataURL(file);
    }

    const form = <Form style={{display: "none"}}>
        <Form.Group className="mb-3">
            <Form.Label>Choose an image</Form.Label>
            <Form.Control id={"preview_chooser" + highlightedGUID} type="file" accept=".png,.jpg,.bmp,.jpeg" onChange={handleImageChange} />
        </Form.Group>
    </Form>

    return <div className='nodeContextMenu'>
        <Button title="delete transformation" onClick={handleNodeTrashIcon}><FontAwesomeIcon icon={faTrash} /></Button>
        {
            node.value.isSource ? <></> :
                <>
                    <Button title="preview" onClick={handleNodePreviewIcon}>{previewIcon}</Button>
                    <Button title="visualization" onClick={handleNodeVisualizationIcon}>{visualizationIcon}</Button>
                </>
        }
        {
            node.value.isSource && node.value.canvas.height != 1 && node.value.canvas.width != 1 ?
                <>
                    {form}
                    <Button title="choose image" onClick={() => document.getElementById("preview_chooser" + highlightedGUID)?.click()}>{chooseImageIcon}</Button>
                </> : <></>
        }
    </div>
}


export const GraphSpace = forwardRef(GraphSpaceComponent);