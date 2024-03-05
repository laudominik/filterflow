import React from "react"
import { ReactNode, useContext, useState, useSyncExternalStore } from "react";
import { GUID } from "../../engine/engine";
import { Button, Card, CardBody, CardHeader, CardTitle, Collapse } from "react-bootstrap";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import './GraphNode.css';
import { nodeStoreContext } from "../../stores/context";

interface NodeBodyProps {
    children: ReactNode;
}

type NodeMouseEvent = React.MouseEvent;
export type IOFunctionType = (e: React.SyntheticEvent, myGUID: GUID, inputNo: number) => void;


interface NodeProps {
    children: ReactNode;
    guid: GUID;
    style?: React.CSSProperties;
    onBodyClick?: (e : NodeMouseEvent)=>void;
    ioFunction?: IOFunctionType
    // mouseOver&touchOver (for inputs/node itselt) - for creating edges
    // touch (handle click and drag) - for selecting and drag
    // touch (handle click and drag)
    
}


const GraphNode: React.FC<NodeProps> = ({ children, 
    guid,
    style,
    onBodyClick,
    ioFunction
    }) => {
    const nodeContext = useContext(nodeStoreContext) 
    const node = useSyncExternalStore(nodeContext.subscribeNode(guid), nodeContext.getNode(guid));
    const [open, setOpen] = useState(false);
    
    const handleOpenClick = () => {
        setOpen(!open)
    }

    const inputs = <div className="circle-container">
        {
            [...Array(node.value.meta.input_size)].map(
                (_,i) => <div key={i}  className="circle circle-top" onMouseDown={(e) => ioFunction ? ioFunction(e, guid, i) : {}}></div>
            )
        }
    </div>

    // if(style){
    //     style.backgroundColor = node.value.getColor();
    //     style.color = "black";
    // }

    const outputs = <div className="circle-container"><div className="circle circle-bottom" onMouseDown={(e) => ioFunction ? ioFunction(e, guid, 0) : {}}></div></div>
    return  <div className="draggable transformNode" id={guid} key={guid} style={{left: node.value.getPos().x, top: node.value.getPos().y}}>
            {inputs}
            <div className="graphNode" id={guid} onMouseDown={onBodyClick}>   
                <Card className="transformCard" style={style}>
                    <Card.Header className="cardHeader">
                        {node.value.getName()}
                        : {guid}
                        <div>
                            <Button 
                                className='border-0 bg-transparent'
                                onClick={handleOpenClick}
                                aria-expanded={open}>
                                <FontAwesomeIcon className="iconInCard" icon={open ? faChevronDown : faChevronUp} />
                            </Button>
                        </div>
                    </Card.Header>
                    <Collapse in={open}>
                        <Card.Body>
                            {/* {children} */}
                            {/* TODO: render node parameters */}
                            {children ?? node.value.paramView(guid)}
                        </Card.Body>
                    </Collapse>
                </Card>
            </div>
            {outputs}
        </div>
};

export default GraphNode;
