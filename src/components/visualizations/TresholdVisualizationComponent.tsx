import { ReactNode, useContext, useSyncExternalStore } from "react"
import { GUID } from "../../engine/engine"
import { ChannelValue, FilterStoreContext } from "../../stores/simpleFilterStore"
import PixelComponent from "./PixelComponent"
import AdnotateElement, { AdnotateText } from "./AdnotationComponent"
import { nodeStoreContext, previewStoreContext } from "../../stores/context"

export default function TresholdVisualizationComponent({guid}: {guid: GUID}) {
    const nodeContext = useContext(nodeStoreContext);
        
    const previewContext = useContext(previewStoreContext);
    const previewStore = previewContext.getPreviewStore(guid)!;

    const preview = useSyncExternalStore(previewStore.subscribeContext, previewStore.getContext);
    const inputId = preview.inputs[0];

    const node = useSyncExternalStore(nodeContext.subscribeNode(guid), nodeContext.getNode(guid));
    const inputNode = useSyncExternalStore(nodeContext.subscribeNode(inputId), nodeContext.getNode(inputId));
    
    
    const selection = useSyncExternalStore(previewStore.subscribeSelection, previewStore.getSelection);
    // TODO: update when params changed
    
    // TODO: optimize pixel allocation
    const pixels = inputNode.value.getPixels(selection.preview.source.start, selection.preview.source.size)

    const rgb: [number, number, number] = [pixels[0],pixels[1], pixels[2]]
    const value: number = pixels[ChannelValue[selection.channel]]
    const treshold: number = node.value.params["argument"]
    const result: number = 255 * (value > treshold ? 1 : 0)    
    return <>
    {PixelComponent([255,255,255], selection.channel)} * <ruby>({PixelComponent(rgb, selection.channel)} {">"} {AdnotateText(`${treshold}`, "treshold", "under")})<rt>{value > treshold ? "true" : "false" }</rt></ruby> = {AdnotateElement(PixelComponent([result, result, result],selection.channel), "result", "under")}</>    
}