import { GUID } from "../../engine/engine";
import GraphNode from "./GraphNode";

export default function TransformGraphNode({ guid }: { guid: GUID }){

   return <GraphNode guid={guid}>
        {/* TODO: make it dependent on number of node inputs */}
        <GraphNode.Before><div className="circle-container"><div className="circle circle-top"></div><div className="circle circle-top"></div></div></GraphNode.Before>
        <GraphNode.Body>body</GraphNode.Body>
    </GraphNode>
    
}