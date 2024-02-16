import { useEffect, useRef } from "react";

export default function Grid({displacement, scale, size, clusterSize=5, baseSize=80, levels=2}:{displacement: [number, number], scale: number, size: [number, number], clusterSize?: number, baseSize?: number, levels?:number}){
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(()=>{
        console.log("updated component")
    }, [])


    // TODO: add final touches, and paramterize
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

        const levelInfo = {minium: 0, maximum: 5, poly: 3};
        ctx?.clearRect(0,0,width, height)
        ctx!.strokeStyle = color;

        
        // figure out the starting size (not base)
        for (let lv = 0; lv < levelInfo.poly; lv++) {
            let pow = lv + (level % 1);
            const visi = (pow - gridVisibilityRange.invisible)/(gridVisibilityRange.fully_visible - gridVisibilityRange.invisible)
            const visibility = Math.min(Math.max(visi*100, 0), 100);
            
            const scaleCoeff = Math.pow(clusterSize, pow)
            const gridSize =  scaleCoeff * baseSize;
            const dashSize = 4 * scaleCoeff
            
            ctx!.strokeStyle = `color-mix(in lch, ${color}, ${100 - visibility}% transparent)`;
            ctx?.setLineDash([dashSize, dashSize])
            if(lv === 2){
                ctx?.setLineDash([])
            }
            ctx?.beginPath();
            
            const offsetX = displacement[0] % gridSize;
            const dashOffsetY = displacement[1] % (2*dashSize) - dashSize;
            for (let pos = offsetX; pos < width; pos+=gridSize) {
                ctx?.moveTo(pos, dashOffsetY);
                ctx?.lineTo(pos, height);      
            }
    
            const offsetY = displacement[1] % gridSize;
            const dashOffsetX = (displacement[0] % (2*dashSize)) - dashSize;
            for (let pos = offsetY; pos < height; pos+=gridSize) {
                ctx?.moveTo(dashOffsetX, pos);
                ctx?.lineTo(width, pos);
            }
            ctx?.closePath();
            ctx?.stroke();

        }
    }, [scale,displacement])

    return <canvas className="graphViewGrid" width={size[0]} height={size[1]} ref={canvasRef}></canvas>
}