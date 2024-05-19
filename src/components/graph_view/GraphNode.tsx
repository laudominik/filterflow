import React from "react"
import {ReactNode, useContext, useState, useSyncExternalStore} from "react";
import {GUID} from "../../engine/engine";
import {Button, Card, CardBody, CardHeader, CardTitle, Collapse} from "react-bootstrap";
import {faChevronDown, faChevronUp} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

import './GraphNode.css';
import {connectionStoreContext, nodeStoreContext, persistenceContext} from "../../stores/context";
import Transform from "../../engine/Transform";

interface NodeBodyProps {
    children: ReactNode;
}

type NodeMouseEvent = React.MouseEvent;
export type IOFunctionType = (e: React.SyntheticEvent, myGUID: GUID, inputNo: number) => void;


interface NodeProps {
    children: ReactNode;
    guid: GUID;
    style?: React.CSSProperties;
    onBodyClick?: (e: React.PointerEvent) => void;
    ioFunction?: IOFunctionType
    // mouseOver&touchOver (for inputs/node itselt) - for creating edges
    // touch (handle click and drag) - for selecting and drag
    // touch (handle click and drag)

}


const GraphNode: React.FC<NodeProps> = ({children,
    guid,
    style,
    onBodyClick,
    ioFunction
}) => {
    const nodeContext = useContext(nodeStoreContext)
    const connectionContext = useContext(connectionStoreContext);

    const node = useSyncExternalStore(nodeContext.subscribeNode(guid), nodeContext.getNode(guid));
    //const inputSize = useSyncExternalStore(nodeContext.subscribeNode(guid), node.value.getInputSize.bind(node.val))
    const [open, setOpen] = useState(node.value.getExpanded());

    const handleOpenClick = (e: NodeMouseEvent) => {
        e.preventDefault()
        node.value.setExpanded(!open)
        setOpen(!open)
        nodeContext.updateParam(guid, 0)
    }

    const inputs = <div className="circle-container">
        {
            [...Array(node.value.meta.input_size)].map(
                (_, i) => <button key={`input-${guid}-${i}`} className="circle circle-top" onMouseDown={(e) => ioFunction ? ioFunction(e, guid, i) : {}}></button>
            )
        }
    </div>
    const outputs = <div className="circle-container"><button className="circle circle-bottom" onMouseDown={(e) => ioFunction ? ioFunction(e, guid, 0) : {}}></button></div>
    return <div className="draggable transformNode" id={guid} key={guid} style={{left: node.value.getPos().x, top: node.value.getPos().y}}>
        {inputs}
        <div className="graphNode" onPointerDown={onBodyClick}>
            <Card className="transformCard" style={style}>
                <Card.Header className="cardHeader">
                    {/* {`${node.value.getName()} : ${node.value.meta.id}`} */}
                    {node.value.getName()}
                    <div onPointerDown={e => handleOpenClick(e)}>
                        <Button
                            className='border-0 bg-transparent'
                            aria-expanded={open}
                        >
                            <FontAwesomeIcon className="iconInCard" icon={open ? faChevronDown : faChevronUp} />
                        </Button>
                    </div>
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
