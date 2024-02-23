import { GUID } from "../../engine/engine";
import GraphNode, { IOFunctionType } from "./GraphNode";

export default function TransformGraphNode({ guid, style, onBodyClick, ioFunction }: { guid: GUID, style: React.CSSProperties, onBodyClick?: (e : React.MouseEvent)=>void, ioFunction?: IOFunctionType}){

   return <GraphNode guid={guid} onBodyClick={onBodyClick} style={style} ioFunction={ioFunction}>
        {/* TODO: make it dependent on number of node inputs */}
        body
    </GraphNode>
    
}