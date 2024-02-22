import React from "react"
import { ReactNode, useContext, useState, useSyncExternalStore } from "react";
import { GUID } from "../../engine/engine";
import { Button, Card, CardBody, CardHeader, CardTitle, Collapse } from "react-bootstrap";
import { graphContext } from "../../stores/graphFilterStore";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface NodeBodyProps {
    children: ReactNode;
}

interface NodeProps {
    children: ReactNode;
    guid: GUID;
}

const NodeBody: React.FC<NodeBodyProps> = ({ children }) => {
    return <>{children}</>
};

const GraphNode: React.FC<NodeProps> & {
    Body: React.FC<NodeBodyProps>;
} = ({ children, guid }) => {
    const graphStore = useContext(graphContext) 
    const node = useSyncExternalStore(graphStore.subscribeNode(guid) as any, graphStore.getNode.bind(graphStore, guid));
    const [open, setOpen] = useState(false);

    const handleOpenClick = () => {
        setOpen(!open)
    }

    const body = React.Children.toArray(children).find((child) => {
        return React.isValidElement(child) && child.type === NodeBody;
    });

    // TODO: node has information about possible inputs, outputs and connections

    return  <div className="graphNode">
        <Card className="transformCard">
            <Card.Header className="cardHeader">
                {node.value.getName()}
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
                    {body}
                </Card.Body>
            </Collapse>
        </Card>
    </div>
    
    
};

GraphNode.Body = NodeBody;

export default GraphNode;
