import { ReactNode, useContext, useEffect, useSyncExternalStore } from "react"
import { GUID } from "../../engine/engine"
import { Channel, ChannelValue, FilterStoreContext } from "../../stores/simpleFilterStore"
import PixelComponent, { ColorComponent } from "./PixelComponent"
import AdnotateElement, { AdnotateText } from "./AdnotationComponent"
import { nodeStoreContext, previewStoreContext } from "../../stores/context"

export default function ConvolutionVisualizationComponent({guid}: {guid: GUID}) {
    const nodeContext = useContext(nodeStoreContext);
        
    const node = useSyncExternalStore(nodeContext.subscribeNode(guid), nodeContext.getNode(guid));
    const previewContext = useContext(previewStoreContext);
    const previewStore = previewContext.getPreviewStore(guid)!;
    const selection = useSyncExternalStore(previewStore.subscribeSelection.bind(previewStore), previewStore.getSelection.bind(previewStore));

    // console.log(node.value.getParams())
    const input = node.value.inputs.get(0)
    let inputId = guid;
    if(input){
        inputId = input[0]
    }

    const inputNode =  useSyncExternalStore(nodeContext.subscribeNode(inputId), nodeContext.getNode(inputId));
    const pixels = inputNode.value.getPixels(selection.preview.source.start, selection.preview.source.size);
    const res_pixel = node.value.getPixels(selection.preview.destination.start, selection.preview.destination.size);
    const channelOffset = ChannelValue[selection.channel]

    const kernel: number[][] = node.value.getParams()["kernel"]
    const kernelWeight = node.value.getParams()["weight"] ?? 1

    const rowsN = kernel.length
    const colsN = kernel[0].length

    const sum = [...Array(rowsN)].map((_,i)=>{
        return [...Array(colsN)].map((_,ii)=>{
            let pos = ((rowsN-i-1)*colsN + ii)*4
            return pixels[pos+channelOffset] * kernel[i][ii]
        }).reduce((sum, value) => sum+value, 0)
    }).reduce((sum,value) => sum+value, 0);

    return <>
        <hr/>
        {drawPixelValues(pixels, kernel, selection.channel)}
        = {AdnotateText(`${sum}`, "sum", "under")}
        
        <br/>
        {AdnotateText(`${sum}`, "sum", "under")} / {AdnotateText(`${kernelWeight}`, "kernel weight", "under")} = {Math.trunc(sum/kernelWeight)} → {AdnotateElement(ColorComponent(res_pixel[channelOffset], selection.channel), "result", "under")}
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
                return <td><ruby>({ColorComponent(pixels[pos+channelOffset], channel)} * {kernel[i][ii]}) <rt>{pixels[pos+channelOffset] * kernel[i][ii]}</rt>{ii+1 === colsN ? "" : "+ "}</ruby></td>
            })}</tr>
        })
    }</table>
}