import { ReactNode, useContext, useSyncExternalStore } from "react"
import { GUID } from "../../engine/engine"
import { Channel, ChannelValue, FilterStoreContext } from "../../stores/simpleFilterStore"
import PixelComponent, { ColorComponent } from "./PixelComponent"
import AdnotateElement, { AdnotateText } from "./AdnotationComponent"

export default function ConvolutionVisualizationComponent({guid}: {guid: GUID}) {
    const filterContext = useContext(FilterStoreContext)
    
    const preview = useSyncExternalStore(filterContext.subscribePreview.bind(filterContext) as any, filterContext.getPreview.bind(filterContext))
    const transform = useSyncExternalStore(filterContext.subscribe(guid) as any, filterContext.getTransform.bind(filterContext, guid))
    const selection = useSyncExternalStore(filterContext.subscribeCanvasSelections.bind(filterContext) as any, filterContext.getPreviewSelections.bind(filterContext))

    // TODO: optimalize pixels, remove boilerplate
    const pixels = filterContext.getTransform(preview.start).getPixels(selection.source.start, selection.source.size)
    const res_pixel = transform.getPixels(selection.destination.start, selection.destination.size)
    const channelOffset = ChannelValue[preview.channel]

    const kernel: number[][] = transform.params["kernel"]
    const kernelWeight = transform.params["weigth"] ?? 1

    const rowsN = kernel.length;
    const colsN = kernel[0].length

    const sum = [...Array(rowsN)].map((_,i)=>{
        return [...Array(colsN)].map((_,ii)=>{
            let pos = ((rowsN-i-1)*colsN + ii)*4
            return pixels[pos+channelOffset] * kernel[i][ii]
        }).reduce((sum, value) => sum+value, 0)
    }).reduce((sum,value) => sum+value, 0);

    return <>
        <hr/>
        {drawPixelValues(pixels, kernel, preview.channel)}
        = {AdnotateText(`${sum}`, "sum", "under")}
        <br/>
        {AdnotateText(`${sum}`, "sum", "under")} / {AdnotateText(`${kernelWeight}`, "kernel weight", "under")} = {Math.trunc(sum/kernelWeight)} → {AdnotateElement(ColorComponent(res_pixel[channelOffset], preview.channel), "result", "under")}
    </>    
}

function drawPixelValues(pixels: Uint8Array, kernel:number[][], channel: Channel){
    const channelOffset = ChannelValue[channel]

    // kernel[row][col]
    const rowsN = kernel.length;
    const colsN = kernel[0].length

    return <table>{
        [...Array(rowsN)].map((_,i)=>{
            return <tr>{[...Array(colsN)].map((_,ii)=>{
                let pos = ((rowsN-i-1)*colsN + ii)*4
                return <ruby>({ColorComponent(pixels[pos+channelOffset], channel)} * {kernel[i][ii]}) <rt>{pixels[pos+channelOffset] * kernel[i][ii]}</rt>{ii+1 === colsN ? "" : "+ "}</ruby>
            })}</tr>
        })
    }</table>
}