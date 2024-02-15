import { useState } from "react";
import { GUID } from "../../engine/engine";

export default function GraphNode({ guid }: { guid: GUID }){

    const [position, setPosition] = useState({x:0, y:0});
    
    // TODO: track global position, and handle unclick even if is outside the node
    // found this: https://jsfiddle.net/Af9Jt/2/
    // https://stackoverflow.com/questions/20926551/recommended-way-of-making-react-component-div-draggable



    return <div className="graphNode"></div>
    
}