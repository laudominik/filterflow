import { ReactNode, useContext, useSyncExternalStore } from "react"
import { GUID } from "../../engine/engine"
import { ChannelValue, FilterStoreContext } from "../../stores/simpleFilterStore"
import PixelComponent from "./PixelComponent"
import AdnotateElement, { AdnotateText } from "./AdnotationComponent"
import { nodeStoreContext, previewStoreContext } from "../../stores/context"

export default function BinaryMulVisualizationComponent({guid}: {guid: GUID}) {
    const nodeContext = useContext(nodeStoreContext);
        
    const node = useSyncExternalStore(nodeContext.subscribeNode(guid), nodeContext.getNode(guid));
    const previewContext = useContext(previewStoreContext);
    const previewStore = previewContext.getPreviewStore(guid)!;
    const selection = useSyncExternalStore(previewStore.subscribeSelection.bind(previewStore), previewStore.getSelection.bind(previewStore));

    const leftInput = node.value.inputs.get(0)
    const rightInput = node.value.inputs.get(1)

    let lftInputId = guid;
    let rgtInputId = guid;
    if(leftInput && rightInput){
        lftInputId = leftInput[0];
        rgtInputId = rightInput[0];
    }
    const leftInputNode = useSyncExternalStore(nodeContext.subscribeNode(lftInputId), nodeContext.getNode(lftInputId));
    const rightInputNode = useSyncExternalStore(nodeContext.subscribeNode(rgtInputId), nodeContext.getNode(rgtInputId));

    const l_pixels = leftInputNode.value.getPixels(selection.preview.source.start, selection.preview.source.size)
    const l_rgb: [number, number, number] = [l_pixels[0],l_pixels[1], l_pixels[2]]
    const l_value: number = l_pixels[ChannelValue[selection.channel]]
    const l_float_val = l_value/255.0;

    const r_pixels = rightInputNode.value.getPixels(selection.preview.source.start, selection.preview.source.size)
    const r_rgb: [number, number, number] = [r_pixels[0],r_pixels[1], r_pixels[2]]
    const r_value: number = r_pixels[ChannelValue[selection.channel]]
    const r_float_val = r_value/255.0;


    const res_pixel = node.value.getPixels(selection.preview.destination.start, selection.preview.destination.size);
    const res_rgb: [number, number, number] = [res_pixel[0], res_pixel[1], res_pixel[2]];
    const res_value = res_pixel[ChannelValue[selection.channel]];
    
    return <><div>
    {AdnotateElement(<>({AdnotateElement(PixelComponent(l_rgb, selection.channel), "left input", "under")}/255)</>, l_float_val.toFixed(2), "over")} {"*"} {AdnotateElement(<>({AdnotateElement(PixelComponent(r_rgb, selection.channel), "right input", "under")}/255)</>, r_float_val.toFixed(2), "over")} = {AdnotateElement(<>{(l_float_val * r_float_val).toFixed(2)}</>, "value", "under")}
    </div>
    <div style={{padding: "3px 0"}}>
        {AdnotateElement(<>{(l_float_val * r_float_val).toFixed(2)}</>, "value", "under")} * {PixelComponent([255,255,255], selection.channel)} → {AdnotateElement(PixelComponent(res_rgb, selection.channel), "result", "under")}
    </div>
        </>    
}