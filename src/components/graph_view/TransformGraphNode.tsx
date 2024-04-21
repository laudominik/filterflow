import { GUID } from "../../engine/engine";
import GraphNode, { IOFunctionType } from "./GraphNode";

export default function TransformGraphNode({ guid, style, onBodyClick, ioFunction }: { guid: GUID, style: React.CSSProperties, onBodyClick?: (e : React.PointerEvent)=>void, ioFunction?: IOFunctionType}){

   return <GraphNode guid={guid} onBodyClick={onBodyClick} style={style} ioFunction={ioFunction}>
    </GraphNode>
    
}