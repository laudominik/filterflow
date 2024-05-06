import React, {CSSProperties, ChangeEvent, ReactNode, Ref, forwardRef, useContext, useEffect, useImperativeHandle, useRef, useState, useSyncExternalStore} from "react";
import GraphNode from "./GraphNode";
import ImportGraphNode from "./ImportGraphNode";
import TransformGraphNode from "./TransformGraphNode";
import {Button, Form} from "react-bootstrap";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {connectionStoreContext, nodeStoreContext, notebookStoreContext, persistenceContext, previewStoreContext} from "../../stores/context";
import {faAnkh, faComment, faCommentDots, faDoorClosed, faDoorOpen, faImagePortrait, faL, faTrash} from "@fortawesome/free-solid-svg-icons";
import {GUID} from "../../engine/nodeResponse";
import GraphEdge, {AnimationEdge, Edge, PreviewEdge} from "./GraphEdge";
import PreviewContainer from "../preview_container/PreviewContainer";
import GraphPreview from "./GraphPreview";
import {useSessionStorage} from "usehooks-ts";
import {PreviewStore} from "../../stores/previewStore";
import {useCommand} from "../../util/commands";


export interface GraphSpaceInterface {
    getDebugSpaceSize: () => {x: number, y: number},
    getSpaceRect: () => DOMRect | undefined
}

export default function GraphSpaceComponent({children = undefined, scale, offset}: {children?: ReactNode, scale: number, offset: {x: number, y: number}}, forwardedRef: Ref<GraphSpaceInterface>) {

    const viewRef = useRef<HTMLDivElement>(null);
    const notebooksContext = useContext(notebookStoreContext)
    const nodeContext = useContext(nodeStoreContext);
    const nodeCollection = useSyncExternalStore(nodeContext.subscribeNodeCollection.bind(nodeContext), nodeContext.getNodeCollection.bind(nodeContext));
    const connectionContext = useContext(connectionStoreContext);
    const connectionCollection = useSyncExternalStore(connectionContext.subscribeConnections.bind(connectionContext) as any, connectionContext.getConnections.bind(connectionContext));

    const previewContext = useContext(previewStoreContext);
    const openedPreviews = useSyncExternalStore(previewContext.subscribePreviews.bind(previewContext) as any, previewContext.getPreviews.bind(previewContext))
    const [_, setOpenedPreviewsState] = useState<string>()

    const [debSpaceSize, setDebSpaceSize] = useState({x: 0, y: 0})

    const [highlightedEdge, setHightlightedEdge] = useState<{guid0: GUID, guid1: GUID, inputNo: number}>({guid0: "", guid1: "", inputNo: 0})
    const [highlightedGUID, setHighlightedGUID] = useState("")

    let [addingGUID, setAddingGUID] = useState("");
    const [addingInputConnection, setAddingInputConnection] = useState(false);
    const [addingInputNo, setAddingInputNo] = useState(0);
    const [addingOutputConnection, setAddingOutputConnection] = useState(false);

    const [addMovePos, setAddMovePos] = useState({x: 0, y: 0})
    const [addingEdgeAnimationComponent, setAddingEdgeAnimationComponent] = useState(<></>)

    const [connectionComponent, setConnectionComponent] = useState(handleConnections())

    const [previewConnectionComponent, setPreviewConnectionComponent] = useState(handlePreviewConnections())

    useEffect(() => {
        setHightlightedEdge({guid0: "", guid1: "", inputNo: 0});
        setHighlightedGUID("");
        setAddingGUID("");
        setAddingInputConnection(false);
        setAddingInputNo(0);
        setAddingOutputConnection(false);
        setAddMovePos({x: 0, y: 0});
        setAddingEdgeAnimationComponent(<></>);
        setConnectionComponent(handleConnections());
        setPreviewConnectionComponent(handlePreviewConnections());
        window.removeEventListener('mousemove', addMove);
    }, [notebooksContext.getSelected()])

    useEffect(() => {
        setConnectionComponent(handleConnections())
    }, [connectionCollection])

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

    useCommand({
        name: "Delete Node",
        binding: ["Delete"],
        callback: handleNodeTrashIcon,
        dependencies: [highlightedGUID]
    });

    useCommand({
        name: "Delete Edge",
        binding: ["Delete"],
        callback: handleEdgeTrashIcon,
        dependencies: [highlightedEdge]
    });

    let dragTarget: HTMLElement | undefined = undefined;
    let dragMouseStartX = 0;
    let dragMouseStartY = 0;
    let dragTargetStartX = 0, dragTargetStartY = 0;
    let dragDistance = 0;

    function dragStart(e: React.PointerEvent) {
        if (!(e.nativeEvent.target instanceof HTMLElement)) return;
        let closest = e.nativeEvent.target.closest('.draggable');
        if (!(closest instanceof HTMLElement)) return;

        e.stopPropagation();

        dragMouseStartX = e.nativeEvent.pageX;
        dragMouseStartY = e.nativeEvent.pageY;

        dragMouseStartX = dragMouseStartX / scale - offset.x
        dragMouseStartY = dragMouseStartY / scale - offset.y

        dragDistance = 0;

        dragTarget = closest;

        const rect = dragTarget?.getBoundingClientRect();
        const viewRect = viewRef.current?.getBoundingClientRect();

        // this results in real position
        dragTargetStartX = rect ? (window.scrollX + (rect.left - viewRect!.x) / scale) : 0;
        dragTargetStartY = rect ? (window.scrollY + (rect.top - viewRect!.y) / scale) : 0;
        // move to front
        window.addEventListener('pointermove', dragMove, {passive: false});
        window.addEventListener('pointerup', dragStop, {passive: false});
        if (!dragTarget) return;


        if (dragTarget.classList.contains("transformNode")) {
            setHighlightedGUID(dragTarget.id)
            setHightlightedEdge({guid0: "", guid1: "", inputNo: 0})
            return;
        }
        if (dragTarget.classList.contains("previewNode")) {
            setHighlightedGUID(dragTarget.id.slice(2))
            setHightlightedEdge({guid0: "", guid1: "", inputNo: 0})
            return;
        }
    }


    function dragStop(e: PointerEvent) {
        if (dragTarget) {
            e.preventDefault();
            e.stopPropagation();

            dragTarget.classList.remove('dragging');
            if (dragTarget.classList.contains("transformNode")) {
                nodeContext.updateParam(dragTarget.id, {})
            }
            if (dragTarget.classList.contains("previewNode")) {
                nodeContext.updateParam(dragTarget.id.slice(2), {})
            }
            dragTarget = undefined

            // dragging is a rare event, so it won't be too much overhead
            window.removeEventListener('pointermove', dragMove)
            window.removeEventListener('pointerup', dragStop)

            // we are forcing to drag by default, handle tap
            if (dragDistance === 0) {
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

    function handleConnections() {
        return connectionCollection.map(connInf => {
            const connDef = connInf.connectionDefinition;
            const guid0 = connDef[0][0];
            const guid1 = connDef[1][0];
            const inputNumber = connDef[1][1];

            const onEdgeClick = (guid0: GUID, guid1: GUID, inputNo: number) => {
                setHighlightedGUID("")
                setHightlightedEdge({guid0: guid0, guid1: guid1, inputNo: inputNo})
            }
            const highlighted = highlightedEdge.guid0 === guid0 && highlightedEdge.guid1 === guid1 && highlightedEdge.inputNo === inputNumber;
            return <GraphEdge key={`con-${guid0}-to-${guid1}-at-${inputNumber}`} guid0={guid0} guid1={guid1} inputNumber={inputNumber} highlighted={highlighted} onClick={onEdgeClick} />
        })
    }

    function handleNodePreviewIcon() {
        if (Array.from(openedPreviews.keys()).find(el => el == highlightedGUID)) {
            previewContext.removePreviewStore(highlightedGUID)
            setOpenedPreviewsState(crypto.randomUUID())
            return;
        }

        previewContext.addPreviewStore(highlightedGUID, [], highlightedGUID)
        previewContext.getPreviewStore(highlightedGUID)!.updateContext([], "", false);
        setOpenedPreviewsState(crypto.randomUUID())
    }

    function handleNodeVisualizationIcon() {
        if (Array.from(openedPreviews.keys()).find(el => el == highlightedGUID)) {
            const preview = previewContext.getPreviewStore(highlightedGUID)!
            preview.updateContext([], "", !preview.getContext().visualizationEnabled)
            return;
        }
        previewContext.addPreviewStore(highlightedGUID, [], highlightedGUID)
        previewContext.getPreviewStore(highlightedGUID)!.updateContext([], "", true);
        setOpenedPreviewsState(crypto.randomUUID())
    }

    function handlePreviewConnections() {
        return Array.from(openedPreviews.keys()).map(guid => <PreviewEdge guid={guid} />)
    }


    function dragMove(e: PointerEvent) {
        if (dragTarget) {
            e.preventDefault();
            e.stopPropagation();

            const vx = (e.pageX);
            const vy = (e.pageY)
            const dx = (vx / scale - offset.x - dragMouseStartX)
            const dy = (vy / scale - offset.y - dragMouseStartY)
            dragDistance += dx + dy;
            const x = dragTargetStartX + dx;
            const y = dragTargetStartY + dy;

            dragTarget.style.left = `${x}px`;
            dragTarget.style.top = `${y}px`;

            if (dragTarget.classList.contains("transformNode")) {
                nodeContext.getNode(dragTarget.id)().value.setPos({x, y})
                setConnectionComponent(handleConnections())
                setPreviewConnectionComponent(handlePreviewConnections())
            }

            if (dragTarget.classList.contains("previewNode")) {
                nodeContext.getNode(dragTarget.id.slice(2))().value.setPreviewPos({x, y})
                setConnectionComponent(handleConnections())
                setPreviewConnectionComponent(handlePreviewConnections())
            }
        }
    }
    //#endregion
    //#region input/output MouseEvents

    function connectionToggle(e: React.SyntheticEvent, myGUID: GUID, inputNo: number) {
        if (!(e.nativeEvent.target instanceof HTMLElement)) return;

        let closest = e.nativeEvent.target;
        if (!(closest instanceof HTMLElement)) return;

        const input = closest.classList.contains("circle-top");

        if (addingInputConnection && !input && addingGUID != myGUID) {
            setAddingInputConnection(false);
            connectionContext.connectNodes([
                [myGUID, 0],
                [addingGUID, addingInputNo]
            ])
            window.removeEventListener('mousemove', addMove);
            return;
        }

        if (addingOutputConnection && input && addingGUID != myGUID) {
            setAddingOutputConnection(false);
            connectionContext.connectNodes([
                [addingGUID, 0],
                [myGUID, inputNo]
            ])
            window.removeEventListener('mousemove', addMove);
            return;
        }

        setAddingInputConnection(input);
        setAddingOutputConnection(!input);
        setAddingInputNo(inputNo);
        setAddingGUID(myGUID);
        window.addEventListener('mousemove', addMove, {passive: false});
        const rectum = closest.getBoundingClientRect();
        setAddMovePos({x: rectum.x, y: rectum.y});
    }


    function addMove(e: MouseEvent) {
        const rectum = document.getElementById("brandNav")!.getClientRects()[0];
        setAddMovePos({x: (e as MouseEvent).pageX, y: (e as MouseEvent).pageY - rectum.height * scale})
        setAddingEdgeAnimationComponent(handleAddingEdgeAnimation())
    }

    //#endregion

    function handleNodeTrashIcon() {
        if ((addingInputConnection || addingOutputConnection) && addingGUID == highlightedGUID) {
            setAddingInputConnection(false);
            setAddingOutputConnection(false);
            window.removeEventListener('mousemove', addMove);
        }
        //openedPreviews
        previewContext.removePreviewStore(highlightedGUID)
        setOpenedPreviewsState(crypto.randomUUID())

        // connectionContext.disconnectNodes([
        //     [highlightedEdge.guid0, 0],
        //     [highlightedEdge.guid1, highlightedEdge.inputNo]
        // ])
        nodeContext.removeTransform(highlightedGUID)
        setHighlightedGUID("")
        setConnectionComponent(handleConnections())
        setPreviewConnectionComponent(handleConnections())
    }

    function handleEdgeTrashIcon() {
        if (highlightedEdge.guid0 === "" || highlightedEdge.guid1 === "") return;
        console.log(highlightedEdge)
        connectionContext.disconnectNodes([
            [highlightedEdge.guid0, 0],
            [highlightedEdge.guid1, highlightedEdge.inputNo]
        ])
        setHightlightedEdge({guid0: "", guid1: "", inputNo: 0})
        setConnectionComponent(handleConnections())
    }

    function handleAddingEdgeAnimation() {
        const mouseInGraphSpace = {x: (-offset.x + addMovePos.x) / scale, y: (-offset.y + addMovePos.y) / scale}
        return <AnimationEdge guid={addingGUID} isInput={addingInputConnection} mousePos={mouseInGraphSpace} inputNo={addingInputNo} />
    }

    function handleUnhighlightAll() {
        setHighlightedGUID("")
        setHightlightedEdge({guid0: "", guid1: "", inputNo: 0})

        if (addingInputConnection || addingOutputConnection) {
            setAddingInputConnection(false)
            setAddingOutputConnection(false)
            window.removeEventListener('mousemove', addMove);
        }
    }

    useEffect(() => {
        if (viewRef.current) {
            const rect = viewRef.current.getBoundingClientRect()
            setDebSpaceSize({x: Math.round(rect.width / scale), y: Math.round(rect.height / scale)})
        }
    }, [scale])

    return <>
        <div id="graphSpace" className="graphSpace" ref={viewRef} style={{transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, outline: "1px solid green"}}>
            {/* a gnome here represent a plank size */}
            <div onPointerDown={dragStart} className='draggable' style={{backgroundImage: 'url(filterflow/gnome.webp)', backgroundSize: "0.0085px 0.0085px", width: "0.0085px", height: "0.0085px", top: "-0.0085px"}} />

            {/* DEBUG: coordinates markers */}
            <div style={{position: 'absolute', top: "-2.5rem", left: "-1.5rem"}} className='debugSpaceOverlay'>0, 0</div>
            <div style={{position: 'absolute', top: "100%", left: "100%"}} className='debugSpaceOverlay'>{viewRef.current ? `${debSpaceSize.x}, ${debSpaceSize.y}` : ''}</div>
            <div style={{position: 'absolute', top: "-2.5rem", left: "100%"}} className='debugSpaceOverlay'>{viewRef.current ? `${debSpaceSize.x}, 0` : ''}</div>
            <div style={{position: 'absolute', top: "100%", left: "-1.5rem"}} className='debugSpaceOverlay'>{viewRef.current ? `0, ${debSpaceSize.y}` : ''}</div>
            {/* END DEBUG */}

            {
                handleConnections()
            }
            {addingInputConnection || addingOutputConnection ? handleAddingEdgeAnimation() : <></>}

            {
                Array.from(openedPreviews.keys()).map(guid => {
                    return <GraphPreview guid={guid} onBodyClick={dragStart} />
                })
            }
            {
                handlePreviewConnections()
            }

            {
                nodeCollection.map(guid => {

                    const trf = nodeContext.getNode(guid)().value;
                    const style: CSSProperties = guid == highlightedGUID ? {
                        borderStyle: "solid",
                        borderWidth: "3px",
                        borderColor: "blue",
                        backgroundColor: trf.getColor(),
                        color: "black",
                    } : {
                        borderWidth: "0px",
                        backgroundColor: trf.getColor(),
                        color: "black",
                    }

                    if (trf.name != "source") {
                        style.width = "400px"
                    }

                    return (trf.name == "source" ?
                        () => <ImportGraphNode key={guid} guid={guid} style={style} onBodyClick={dragStart} ioFunction={connectionToggle} /> :
                        () => <TransformGraphNode key={guid} guid={guid} style={style} onBodyClick={dragStart} ioFunction={connectionToggle} />
                    )()
                }
                )
            }

            {children}
        </div>
        {nodeCollection.includes(highlightedGUID) ?
            <NodeContextMenu
                highlightedGUID={highlightedGUID}
                handleNodeTrashIcon={handleNodeTrashIcon}
                handleNodePreviewIcon={handleNodePreviewIcon}
                handleNodeVisualizationIcon={handleNodeVisualizationIcon}
                previewOpen={Array.from(openedPreviews.keys()).find(el => el == highlightedGUID) != undefined} />
            : <></>}

        {highlightedEdge.guid0 && highlightedEdge.guid1 ?
            <div className='nodeContextMenu'>
                <Button onClick={handleEdgeTrashIcon}><FontAwesomeIcon icon={faTrash} /></Button>
            </div>
            : <></>}
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
            node.value.name == "source" ? <></> :
                <>
                    <Button title="preview" onClick={handleNodePreviewIcon}>{previewIcon}</Button>
                    <Button title="visualization" onClick={handleNodeVisualizationIcon}>{visualizationIcon}</Button>
                </>
        }
        {
            node.value.name == "source" && node.value.canvas.height != 1 && node.value.canvas.width != 1 ?
                <>
                    {form}
                    <Button title="choose image" onClick={() => document.getElementById("preview_chooser" + highlightedGUID)?.click()}>{chooseImageIcon}</Button>
                </> : <></>
        }
    </div>
}


export const GraphSpace = forwardRef(GraphSpaceComponent);