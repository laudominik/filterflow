import { ReactNode, useContext, useSyncExternalStore } from "react"
import { GUID } from "../../engine/engine"
import { ChannelValue, FilterStoreContext } from "../../stores/simpleFilterStore"
import PixelComponent from "./PixelComponent"
import AdnotateElement, { AdnotateText } from "./AdnotationComponent"
import { nodeStoreContext, previewStoreContext } from "../../stores/context"

export default function TresholdVisualizationComponent({guid}: {guid: GUID}) {
    const nodeContext = useContext(nodeStoreContext);
        
    const node = useSyncExternalStore(nodeContext.subscribeNode(guid), nodeContext.getNode(guid));
    const previewContext = useContext(previewStoreContext);
    const previewStore = previewContext.getPreviewStore(guid)!;
    const selection = useSyncExternalStore(previewStore.subscribeSelection.bind(previewStore), previewStore.getSelection.bind(previewStore));

    const input = node.value.inputs.get(0)
    let inputId = guid;
    if(input){
        inputId = input[0]
    }
    const inputNode = useSyncExternalStore(nodeContext.subscribeNode(inputId), nodeContext.getNode(inputId));
    const pixels = inputNode.value.getPixels(selection.preview.source.start, selection.preview.source.size)
    const rgb: [number, number, number] = [pixels[0],pixels[1], pixels[2]]
    const value: number = pixels[ChannelValue[selection.channel]]
    const threshold: number = node.value.params["argument"]
    const result: number = 255 * (value > threshold ? 1 : 0)  
    // console.log(value, threshold, result)
    
    return <>
    {PixelComponent([255,255,255], selection.channel)} * <ruby>
        ({PixelComponent(rgb, selection.channel)} {">"} {AdnotateText(`${threshold}`, "treshold", "under")})<rt>{value > threshold ? "true" : "false" }</rt>
        </ruby> = {AdnotateElement(PixelComponent([result, result, result],selection.channel), "result", "under")}</>    
}