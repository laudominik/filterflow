import { useContext, useEffect, useRef } from "react";
import { ScaleOffsetContext } from "./GraphView";

export default function Grid({size, clusterSize=5, baseSize=80, levels=3, levelsVisibility=[50,70, 70], repeat=true}:{size: [number, number], clusterSize?: number, baseSize?: number, levels?:number, levelsVisibility?: Array<number>, repeat?: boolean}){
    const {scale, offset} = useContext(ScaleOffsetContext);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(()=>{
        if(!canvasRef.current) return;
        const maxDimSize = Math.max(size[0], size[1])
        const level = Math.log2(scale)/Math.log2(clusterSize)

        const gridVisibilityRange = {invisible: 0.0, fully_visible: 0.8}
        const color = getComputedStyle(canvasRef.current).getPropertyValue("--grid-color")
        // 

        const ctx = canvasRef.current.getContext("2d");
        const width = canvasRef.current.width;
        const height = canvasRef.current.height;

        const levelInfo = {minium: 0, maximum: 5, poly: 4};
        ctx?.clearRect(0,0,width, height)
        ctx!.strokeStyle = color;

        
        // figure out the starting size (not base)
        for (let lv = 0; lv < levelInfo.poly; lv++) {
            let pow = lv + (level % 1);
            const visi = (pow - gridVisibilityRange.invisible)/(gridVisibilityRange.fully_visible - gridVisibilityRange.invisible)
            const baseVisibility = levelsVisibility[lv]
            const visibility = Math.min(Math.max(visi*100, 0), baseVisibility);
            
            const scaleCoeff = Math.pow(clusterSize, pow)
            const gridSize =  scaleCoeff * baseSize;
            const dashSize = 4 * scaleCoeff;
            
            ctx!.strokeStyle = `color-mix(in lch, ${color}, ${100 - visibility}% transparent)`;
            ctx?.setLineDash([dashSize, dashSize])
            if(lv === 2){
                ctx?.setLineDash([])
            }
            ctx?.beginPath();
            
            const offsetX = offset[0] % gridSize;
            const dashOffsetY = offset[1] % (2*dashSize) - dashSize;
            for (let pos = offsetX; pos < width; pos+=gridSize) {
                ctx?.moveTo(pos, dashOffsetY);
                ctx?.lineTo(pos, height);      
            }
    
            const offsetY = offset[1] % gridSize;
            const dashOffsetX = (offset[0] % (2*dashSize)) - dashSize;
            for (let pos = offsetY; pos < height; pos+=gridSize) {
                ctx?.moveTo(dashOffsetX, pos);
                ctx?.lineTo(width, pos);
            }
            ctx?.closePath();
            ctx?.stroke();

        }
    }, [scale, offset, size, clusterSize, levelsVisibility, baseSize])

    return <canvas className="graphViewGrid" width={size[0]} height={size[1]} ref={canvasRef}></canvas>
}