import {CSSProperties, useContext, useEffect, useReducer, useRef, useState, useSyncExternalStore} from "react";
import {GUID} from "../../engine/engine";
import {nodeStoreContext} from "../../stores/context";
import {node} from "../../engine/node";
import { ScaleOffsetContext } from "./GraphView";
import { ConnectionInfo } from "../../stores/storeInterfaces";


/*
    pos0, pos1 - positions in graph space
    edge is from pos0 to pos1 (i.e. pos0 -> pos1)
*/

export interface EdgeEvents {}

export function Edge({pos0, pos1, onPointerDownCapture, style, marker = true, className}: {pos0: [number, number], pos1: [number, number], onPointerDownCapture?: (e : React.PointerEvent) => void, style?: CSSProperties, marker?: boolean, className?: string}) {

    const margin = 25;
    const arrowHead = [10, 10]
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

    const defaultStyle = {stroke: "url(#myGradient)", strokeWidth: 4}
    const invisibleStyle = {stroke: "rgba(0,0,0,0)", strokeWidth: 40}


    return <svg className={"arrows "+className} style={{pointerEvents: 'none', position: 'absolute', top: top - margin, left: left - margin, width: Math.abs(dx) + 2 * margin, height: Math.abs(dy) + 2 * margin}}>
        <defs>
            {/* from https://webgl2fundamentals.org/webgl/lessons/resources/webgl-state-diagram.html#no-help */}
            <marker id={arrowMarkUUID} viewBox="0 0 10 10" refX="3" refY="5" markerWidth="6" markerHeight="6" orient="auto" fill={style ? style.stroke : "hsl(260, 100%, 80%)"}><path d={`M 0 0 L ${arrowHead[0]} ${arrowHead[1] / 2} L 0 ${arrowHead[1]} z`}></path></marker>
            <linearGradient id="myGradient" gradientTransform="rotate(90)">
                <stop offset="5%" stop-color="hsl(260, 100%, 80%)" />
                <stop offset="95%" stop-color="hsl(270, 100%, 70%)" />
            </linearGradient>
        
        </defs>
        {onPointerDownCapture && <line className="hiddenEdge" x1={x1 + margin} y1={y1 + margin} x2={x2 + margin} y2={y2 + margin} style={invisibleStyle} onPointerDownCapture={onPointerDownCapture} />}
        <line className="visibleEdge" x1={x1 + margin} y1={y1 + margin} x2={x2 + margin} y2={y2 + margin} style={style ?? defaultStyle} markerEnd={marker ? markerEnd : ""} onPointerDownCapture={onPointerDownCapture} />
        {onPointerDownCapture && <rect x={(x1+x2)/2} y={(y1+y2)/2} height={40} width={40} style={{pointerEvents: "none"}} fill="transparent" onPointerDownCapture={onPointerDownCapture} role="button"></rect>}
    </svg>
}

export function AnimationEdge({guid, isInput, mousePos, inputNo}: {guid: GUID, isInput: boolean, mousePos: {x: number, y: number}, inputNo: number}) {
    const nodeContext = useContext(nodeStoreContext);

    if (!nodeContext.getNodeCollection().find(el => el == guid)) {
        return <></>
    }

    let pos0 = nodeContext.getNode(guid)().value.getPos();
    let pos1 = {x: pos0.x, y: pos0.y};

    if (isInput) {
        const draggable = document.getElementById(guid)!
        const input = draggable.getElementsByClassName("circle-top")[inputNo]!;
        if (input instanceof HTMLElement) {
            pos1 = {x: pos1.x + input.offsetLeft + input.offsetWidth / 2, y: pos1.y + input.offsetTop + input.offsetHeight / 2}
            pos0 = mousePos
        }
    } else {
        const draggable = document.getElementById(guid)!
        const output = draggable.getElementsByClassName("circle-bottom")[0]!
        if (output instanceof HTMLElement) {
            pos0 = {x: pos0.x + output.offsetLeft + output.offsetWidth / 2, y: pos0.y + output.offsetTop + output.offsetHeight / 2}
            pos1 = mousePos
        }
    }


    return <Edge pos0={[pos0.x, pos0.y]} pos1={[pos1.x, pos1.y]} />
}

//TODO(@tad1): rename this 
export function NewEdge({handlesId:{src, dst}, observables: {deep, shallow}, style, onPointerDownCapture, className}: {handlesId: {src: string, dst: string}, observables: {deep: string[], shallow: string[]}, style?: React.CSSProperties, onPointerDownCapture?: (e: React.PointerEvent)=>void, className?: string}){
    const [, forceUpdate] = useReducer(x => x + 1, 0);
    const {scale, offset} = useContext(ScaleOffsetContext);

    const srcHandle = document.getElementById(src);
    const dstHandle = document.getElementById(dst);
    const deepEls = deep.map(id => document.getElementById(id));
    const shallowEls = shallow.map(id => document.getElementById(id));
    const deps = deepEls.concat(shallowEls);
    const depsId = deep.concat(shallow)

    // we increase complexity here (basicaly we create our little react here), to get a perfect position update; and element deptendent component mounting
    useEffect(() => {
        const observer = new MutationObserver(() => {forceUpdate()});
        const observeObjects = () => {
            deep.forEach(el => {
                observer.observe(document.getElementById(el)!, {attributes: true, subtree: true, attributeFilter: ['style']})
            })
            shallow.forEach(el => {
                observer.observe(document.getElementById(el)!, {attributes: true, subtree: false, attributeFilter: ['style']})
            })
        }

        const mountObserver = new MutationObserver(mutations => {
            if(depsId.reduce((p,e) => !!document.getElementById(`${e}`) && p, true as boolean)){
                mountObserver.disconnect();
                observeObjects();
            }  
        });

        
        if(!deps.reduce((p,e) => p && e)) {
            mountObserver.observe(document.body, {childList: true, subtree: true})
        } else {
            observeObjects();
        }

        return () => {
            mountObserver.disconnect();
            observer.disconnect();
        }

    }, [])

    if(!srcHandle || !dstHandle) return <></>;
    const srcRect = srcHandle.getBoundingClientRect();
    const dstRect = dstHandle.getBoundingClientRect();
    const pos0 : [number, number] = [srcRect.left + srcRect.width/2, srcRect.top + srcRect.height/2]
    const pos1 : [number, number] = [dstRect.left + dstRect.width/2, dstRect.top + dstRect.height/2]
    
    return <Edge pos0={[(pos0[0]-offset[0])/scale, (pos0[1]-offset[1])/scale]} pos1={[(pos1[0]-offset[0])/scale, (pos1[1]-offset[1])/scale]} style={style} onPointerDownCapture={onPointerDownCapture} className={className}></Edge>
}

export function PreviewEdge({guid}: {guid: GUID}) {
    const nodeContext = useContext(nodeStoreContext);
    const [rerender, setRerender] = useState(false)
    const node = nodeContext.getNode(guid)().value;
    const pos0 = node.getPreviewPos();
    let pos1 = node.getPos();

    useEffect(() => {setRerender(true)}, [])

    const draggableTransform = document.getElementById(guid)
    if (!draggableTransform) {
        return <></>
    }

    const card = draggableTransform.getElementsByClassName("card")[0]!;

    if (card instanceof HTMLElement) {
        pos1 = {x: pos1.x + card.offsetLeft, y: pos1.y + card.offsetTop}
    }

    const style = {stroke: "orange", strokeWidth: 1, strokeDasharray: "10,5"};
    return <Edge pos0={[pos0.x, pos0.y]} pos1={[pos1.x, pos1.y]} style={style} marker={false} />
}


export default function GraphEdge({guid0, guid1, inputNumber, highlighted, onClick}: {guid0: GUID, guid1: GUID, inputNumber: number, highlighted: boolean, onClick?: (guid0: GUID, guid1: GUID, inputNo: number) => void}) {

    const nodeContext = useContext(nodeStoreContext);
    const [rerender, setRerender] = useState(false)

    let pos0 = nodeContext.getNode(guid0)().value.getPos();
    let pos1 = nodeContext.getNode(guid1)().value.getPos();

    useEffect(() => {setRerender(!rerender)}, [])

    const onClickWrapper = () => {
        if (!onClick) return;
        onClick(guid0, guid1, inputNumber);
    }
    const style = {stroke: highlighted ? "blue" : "hsl(260, 100%, 80%)", strokeWidth: 5}

    const draggable0 = document.getElementById(guid0)
    const draggable1 = document.getElementById(guid1)

    if (!draggable0 || !draggable1) {
        return <></>
    }

    const output = draggable0.getElementsByClassName("circle-bottom")[0]!
    const input = draggable1.getElementsByClassName("circle-top")[inputNumber]!;

    if (output instanceof HTMLElement) {
        pos0 = {x: pos0.x + output.offsetLeft + output.offsetWidth / 2, y: pos0.y + output.offsetTop + output.offsetHeight / 2}
    }

    if (input instanceof HTMLElement) {
        pos1 = {x: pos1.x + input.offsetLeft + input.offsetWidth / 2, y: pos1.y + input.offsetTop + input.offsetHeight / 2}
    }




    // for now top left corner connects to top left corner
    return <Edge pos0={[pos0.x, pos0.y]} pos1={[pos1.x, pos1.y]} onPointerDownCapture={onClickWrapper} style={style} />
}