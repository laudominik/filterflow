import { useEffect, useRef } from "react";


/*
    pos0, pos1 - positions in graph space
    edge is from pos0 to pos1 (i.e. pos0 -> pos1)
*/

export default function GraphEdge({pos0, pos1}:{pos0: [number, number], pos1: [number, number]}){
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

    return <svg className="arrows" style={{position: 'absolute', top: top, left: left, width: Math.abs(dx) + 50, height: Math.abs(dy) + 50}}>
        <defs>
            {/* from https://webgl2fundamentals.org/webgl/lessons/resources/webgl-state-diagram.html#no-help */}
            <marker id="hsl-260--100---80--" viewBox="0 0 10 10" refX="3" refY="5" markerWidth="6" markerHeight="6" orient="auto" fill="hsl(260, 100%, 80%)"><path d="M 0 0 L 10 5 L 0 10 z"></path></marker>
            <marker id="hsl-190--100---80--" viewBox="0 0 10 10" refX="3" refY="5" markerWidth="6" markerHeight="6" orient="auto" fill="hsl(190, 100%, 80%)"><path d="M 0 0 L 10 5 L 0 10 z"></path></marker>
            <marker id="hsl-95--100---80--" viewBox="0 0 10 10" refX="3" refY="5" markerWidth="6" markerHeight="6" orient="auto" fill="hsl(95, 100%, 80%)"><path d="M 0 0 L 10 5 L 0 10 z"></path></marker>
        </defs>
        <line x1={x1} y1={y1} x2={x2} y2={y2} style={{stroke: "hsl(260, 100%, 80%)", strokeWidth: 2 }} markerEnd="url(#hsl-260--100---80--)"/>
 
    </svg>
}