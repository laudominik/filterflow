import React from "react"
import {ReactNode, useContext, useState, useSyncExternalStore} from "react";
import {GUID} from "../../engine/engine";
import {Button, Card, Collapse} from "react-bootstrap";
import {faChevronDown, faChevronUp} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

import './GraphNode.css';
import {connectionStoreContext, nodeStoreContext} from "../../stores/context";
import Transform from "../../engine/Transform";
import { IOType } from "../../engine/node";
import { selectedIOContext } from "./GraphSpace";

interface NodeBodyProps {
    children: ReactNode;
}


export type NodePointerEvent = (e: React.PointerEvent, node: Transform, guid : GUID) => void;
export type IOFunctionType = (e: React.PointerEvent, type: IOType, myGUID: GUID, inputNo: number) => void;

export interface GraphNodeEvents {
    nodeEvents?: {
        onPointerDown?: NodePointerEvent;
        onPointerMove?: NodePointerEvent;
        onPointerUp?: NodePointerEvent;
    }
    ioEvents?: {
        onPointerDown?: IOFunctionType;
        onPointerMove?: IOFunctionType;
        onPointerUp?: IOFunctionType;
    }
}

interface NodeProps extends GraphNodeEvents{
    children: ReactNode;
    guid: GUID;
    className?: string;
    style?: React.CSSProperties;

};


const GraphNode: React.FC<NodeProps> = ({children,
    guid,
    className,
    style,
    nodeEvents,
    ioEvents
}) => {
    const nodeContext = useContext(nodeStoreContext)
    const connectionContext = useContext(connectionStoreContext);
    const selectedIO = useContext(selectedIOContext);

    const node = useSyncExternalStore(nodeContext.subscribeNode(guid), nodeContext.getNode(guid));
    //const inputSize = useSyncExternalStore(nodeContext.subscribeNode(guid), node.value.getInputSize.bind(node.val))
    const [open, setOpen] = useState(node.value.getExpanded());

    const handleOpenClick = (e: React.MouseEvent) => {
        e.preventDefault()
        node.value.setExpanded(!open)
        setOpen(!open)
        nodeContext.updateParam(guid, 0)
    }

    const inputs = <div className="circle-container">
        {
            [...Array(node.value.meta.input_size)].map(
                (_, i) => <button key={`input-${guid}-${i}`} id={`input-${guid}-${i}`} className={"circle circle-top input-circle " + (selectedIO?.type === "input" ? "non-selectable-circle" : "") } onPointerDown={(e) => ioEvents?.onPointerDown?.(e, "input", guid, i)}></button>
            )
        }
    </div>
    const outputs = <div className="circle-container"><button id={`output-${guid}-0`} className={"circle circle-bottom output-circle " + (selectedIO?.type === "output" ? "non-selectable-circle" : "")} onPointerDown={(e) => ioEvents?.onPointerDown?.(e, "output", guid, 0)}></button></div>
    return <div className={"draggable transformNode " + className} id={`node-${guid}`} key={guid} style={{left: node.value.getPos().x, top: node.value.getPos().y, transform: "translate(-50%, -50%)"}}>
        {inputs}
        <div className="graphNode" onPointerDown={(e)=>{nodeEvents?.onPointerDown?.(e, node.value, guid)}} onPointerMove={(e)=>{nodeEvents?.onPointerMove?.(e, node.value, guid)}} onPointerUp={(e)=>{nodeEvents?.onPointerUp?.(e, node.value, guid)}}>
            <Card className="transformCard" style={style}>
                <Card.Header className="cardHeader">
                    {/* {`${node.value.getName()} : ${node.value.meta.id}`} */}
                    {node.value.getName()}
                        <Button
                            className='border-0 bg-transparent'
                            aria-expanded={open}
                            onClick={e => handleOpenClick(e)}
                        >
                            <FontAwesomeIcon className="iconInCard" icon={open ? faChevronDown : faChevronUp} />
                        </Button>
                </Card.Header>
                <Collapse in={open} timeout={0}
                    onExited={() => connectionContext.forceConnectionsRefresh()}
                    onEntered={() => connectionContext.forceConnectionsRefresh()}>
                    <Card.Body>
                        {children ?? node.value.paramView(guid)}
                    </Card.Body>
                </Collapse>
            </Card>
        </div>
        {outputs}
    </div>
};

export default GraphNode;
