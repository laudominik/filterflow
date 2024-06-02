import { GUID } from "../../engine/engine";
import GraphNode, { GraphNodeEvents } from "./GraphNode";

export default function TransformGraphNode({ guid, className, ioEvents, nodeEvents}: { guid: GUID, className?: string} & GraphNodeEvents){

   return <GraphNode className={className} guid={guid} ioEvents={ioEvents} nodeEvents={nodeEvents}>
    </GraphNode>
    
}