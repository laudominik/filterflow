import { CSSProperties, useContext, useEffect, useRef } from "react";
import { GUID } from "../../engine/engine";
import { nodeStoreContext } from "../../stores/context";


/*
    pos0, pos1 - positions in graph space
    edge is from pos0 to pos1 (i.e. pos0 -> pos1)
*/

export function Edge({pos0, pos1, onClick, style, marker=true}:{pos0: [number, number], pos1: [number, number], onClick?: ()=>void, style? : CSSProperties, marker?: boolean}){
 

    const dx = pos1[0] - pos0[0];
    const dy = pos1[1] - pos0[1];

    const x1 = dx >= 0 ? 0 : -dx;
    const y1 = dy >= 0 ? 0 : -dy;
    const x2 = dx >= 0 ? dx : 5;
    const y2 = dy >= 0 ? dy : 5;

    const top = pos0[1] > pos1[1] ? pos1[1] : pos0[1];
    const left = pos0[0] > pos1[0] ? pos1[0] : pos0[0];

    const arrowMarkUUID = crypto.randomUUID();
    const markerEnd = `url(#${arrowMarkUUID})`

    const defaultStyle = {stroke: "hsl(260, 100%, 80%)", strokeWidth: 2}


    return <svg className="arrows" style={{pointerEvents: 'none', position: 'absolute', top: top, left: left, width: Math.abs(dx) + 50, height: Math.abs(dy) + 50}}>
        <defs>
            {/* from https://webgl2fundamentals.org/webgl/lessons/resources/webgl-state-diagram.html#no-help */}
            <marker id={arrowMarkUUID} viewBox="0 0 10 10" refX="3" refY="5" markerWidth="6" markerHeight="6" orient="auto" fill={style ? style.stroke : "hsl(260, 100%, 80%)"}><path d="M 0 0 L 10 5 L 0 10 z"></path></marker>
          
        </defs>
        <line x1={x1} y1={y1} x2={x2} y2={y2} style={style ?? defaultStyle} markerEnd={marker ? markerEnd: ""} onClick={onClick} pointerEvents='auto'/>
 
    </svg>
}

export function AnimationEdge({guid, isInput, mousePos, inputNo}: {guid : GUID, isInput: boolean, mousePos: {x: number, y: number}, inputNo: number}){
    const nodeContext = useContext(nodeStoreContext);
    let pos0 = nodeContext.getNode(guid)().value.getPos();
    let pos1 = {x: pos0.x, y: pos0.y};

    if(isInput){
        const draggable = document.getElementById(guid)!
        const input = draggable.getElementsByClassName("circle-top")[inputNo]!;
        if(input instanceof HTMLElement){
            pos1 = {x: pos1.x + input.offsetLeft, y: pos1.y + input.offsetTop}
            pos0 = mousePos
        }
    } else {
        const draggable = document.getElementById(guid)!
        const output = draggable.getElementsByClassName("circle-bottom")[0]!
        if(output instanceof HTMLElement){
            pos0 = {x: pos0.x + output.offsetLeft, y: pos0.y + output.offsetTop}
            pos1 = mousePos
        }
    }


    return <Edge pos0={[pos0.x, pos0.y]} pos1={[pos1.x, pos1.y]}/>
}

export function PreviewEdge({guid}: {guid: GUID}){
    const nodeContext = useContext(nodeStoreContext);
    const node = nodeContext.getNode(guid)().value;
    const pos0 = node.getPreviewPos();
    let pos1 = node.getPos();

    const draggableTransform = document.getElementById(guid)!

    const card = draggableTransform.getElementsByClassName("card")[0]!;

    if(card instanceof HTMLElement){
        pos1 = {x: pos1.x + card.offsetLeft, y: pos1.y + card.offsetTop}
    }
    
    const style= {stroke: "orange", strokeWidth: 1, strokeDasharray: "10,5" };            
    return <Edge pos0={[pos0.x, pos0.y]} pos1={[pos1.x, pos1.y]} style={style} marker={false}/>
}


export default function GraphEdge({guid0, guid1, inputNumber, highlighted, onClick} : {guid0 : GUID, guid1 : GUID, inputNumber: number, highlighted : boolean, onClick?: (guid0: GUID, guid1: GUID, inputNo: number)=>void}){
    
    const nodeContext = useContext(nodeStoreContext);
    let pos0 = nodeContext.getNode(guid0)().value.getPos();
    let pos1 = nodeContext.getNode(guid1)().value.getPos();

    const onClickWrapper = () => {
        if(!onClick) return;
        onClick(guid0, guid1, inputNumber);
    }
    const style= {stroke: highlighted ? "blue" : "hsl(260, 100%, 80%)", strokeWidth: 2 }

    // TODO: check if it doesn't break sometimes (multiple elements with the same id)
    const draggable0 = document.getElementById(guid0)!
    const draggable1 = document.getElementById(guid1)!
    
    const output = draggable0.getElementsByClassName("circle-bottom")[0]!
    const input = draggable1.getElementsByClassName("circle-top")[inputNumber]!;
    
    if(output instanceof HTMLElement){
        pos0 = {x: pos0.x + output.offsetLeft, y: pos0.y + output.offsetTop}
    }

    if(input instanceof HTMLElement){
        pos1 = {x: pos1.x + input.offsetLeft, y: pos1.y + input.offsetTop}
    }

    // for now top left corner connects to top left corner
    return <Edge pos0={[pos0.x, pos0.y]} pos1={[pos1.x, pos1.y]} onClick={onClickWrapper} style={style}/>
}