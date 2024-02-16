import { useState } from "react";
import { GUID } from "../../engine/engine";
import { Card, CardBody, CardHeader, CardTitle } from "react-bootstrap";

export default function GraphNode({ guid }: { guid: GUID }){

    const [position, setPosition] = useState({x:0, y:0});
    
    // TODO: track global position, and handle unclick even if is outside the node
    // found this: https://jsfiddle.net/Af9Jt/2/
    // https://stackoverflow.com/questions/20926551/recommended-way-of-making-react-component-div-draggable

    
    // TODO: node has information about possible inputs, outputs and connections

    return <div className="graphNode">
        <Card>
            <CardTitle>Graph Node</CardTitle>
            <CardBody>Body</CardBody>
        </Card>
    </div>
    
}