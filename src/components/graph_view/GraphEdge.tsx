import { CSSProperties, useContext, useEffect, useRef } from "react";
import { GUID } from "../../engine/engine";
import { nodeStoreContext } from "../../stores/context";


/*
    pos0, pos1 - positions in graph space
    edge is from pos0 to pos1 (i.e. pos0 -> pos1)
*/

export function Edge({pos0, pos1, onClick, style}:{pos0: [number, number], pos1: [number, number], onClick?: ()=>void, style? : CSSProperties}){
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(()=>{
        console.log("updated component")
    }, [])

    const dx = pos1[0] - pos0[0];
    const dy = pos1[1] - pos0[1];

    const x1 = dx >= 0 ? 0 : -dx-5;
    const y1 = dy >= 0 ? 0 : -dy-5;
    const x2 = dx >= 0 ? dx : 5;
    const y2 = dy >= 0 ? dy : 5;

    const top = pos0[1] > pos1[1] ? pos1[1] : pos0[1];
    const left = pos0[0] > pos1[0] ? pos1[0] : pos0[0];

    const arrowMarkUUID = crypto.randomUUID();
    const markerEnd = `url(#${arrowMarkUUID})`
    return <svg className="arrows" style={{position: 'absolute', top: top, left: left, width: Math.abs(dx) + 50, height: Math.abs(dy) + 50}}>
        <defs>
            {/* from https://webgl2fundamentals.org/webgl/lessons/resources/webgl-state-diagram.html#no-help */}
            <marker id={arrowMarkUUID} viewBox="0 0 10 10" refX="3" refY="5" markerWidth="6" markerHeight="6" orient="auto" fill={style ? style.stroke : "hsl(260, 100%, 80%)"}><path d="M 0 0 L 10 5 L 0 10 z"></path></marker>
          
        </defs>
        <line x1={x1} y1={y1} x2={x2} y2={y2} style={style} markerEnd={markerEnd} onClick={onClick}/>
 
    </svg>
}

export default function GraphEdge({guid0, guid1, highlighted, onClick} : {guid0 : GUID, guid1 : GUID, highlighted : boolean, onClick?: (guid0: GUID, guid1: GUID)=>void}){
    
    const nodeContext = useContext(nodeStoreContext);
    const pos0 = nodeContext.getNode(guid0)().value.getPos();
    const pos1 = nodeContext.getNode(guid1)().value.getPos();

    const onClickWrapper = () => {
        if(!onClick) return;
        onClick(guid0, guid1);
    }
    const style= {stroke: highlighted ? "blue" : "hsl(260, 100%, 80%)", strokeWidth: 2 };
    // for now top left corner connects to top left corner
    return <Edge pos0={[pos0.x, pos0.y]} pos1={[pos1.x, pos1.y]} onClick={onClickWrapper} style={style}/>
}