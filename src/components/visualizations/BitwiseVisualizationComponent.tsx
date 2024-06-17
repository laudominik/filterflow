import { ReactNode, useContext, useSyncExternalStore } from "react"
import { GUID } from "../../engine/engine"
import { ChannelValue, FilterStoreContext } from "../../stores/simpleFilterStore"
import PixelComponent from "./PixelComponent"
import AdnotateElement, { AdnotateText } from "./AdnotationComponent"
import { nodeStoreContext, previewStoreContext } from "../../stores/context"

export default function BitwiseVisualizationComponent({guid, operantName}: {guid: GUID, operantName: string}) {
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
    const l_bits = Array.from(("00000000" + l_value.toString(2)).slice(-8))

    const r_pixels = rightInputNode.value.getPixels(selection.preview.source.start, selection.preview.source.size)
    const r_rgb: [number, number, number] = [r_pixels[0],r_pixels[1], r_pixels[2]]
    const r_value: number = r_pixels[ChannelValue[selection.channel]]
    const r_bits = Array.from(("00000000" + r_value.toString(2)).slice(-8))

    const res_pixel = node.value.getPixels(selection.preview.destination.start, selection.preview.destination.size);
    console.log(res_pixel)
    const res_rgb: [number, number, number] = [res_pixel[0], res_pixel[1], res_pixel[2]];
    const res_value = res_pixel[ChannelValue[selection.channel]];
    const res_bits = Array.from(("00000000" + res_value.toString(2)).slice(-8))
    
    return <><table style={{margin: "0.5ch"}}><tbody>
        <tr><td></td><td></td>{l_bits.map((_,i) => <td className="bitwiseComment" style={{color: "GrayText"}} key={i}><small>2<sup>{7-i}</sup></small></td>)}</tr>
        <tr><td>{PixelComponent(l_rgb, selection.channel)}</td><td></td>{l_bits.map((bit, i) => 
            <td className="bitwiseValue" key={i} style={{backgroundColor: bit === "1" ? "lightgray" : "black", color: bit === "1" ? "black" : "white"}}>{bit}</td>
        )}</tr>
        <tr><td>{operantName}</td> <td>⇄</td> {l_bits.map((_, i) => <td className="bitwiseComment" key={i}>{operantName}</td>)}</tr>
        <tr><td>{PixelComponent(r_rgb, selection.channel)}</td><td></td> {r_bits.map((bit, i) => <td key={i} className="bitwiseValue" style={{backgroundColor: bit === "1" ? "lightgray" : "black", color: bit === "1" ? "black" : "white"}}>{bit}</td>)}</tr>
        <tr><td className="bitwiseComment">↓</td><td></td>{l_bits.map(_ => <td className="bitwiseComment">↓</td>)}</tr>
        <tr><td>{PixelComponent(res_rgb, selection.channel)}</td><td>⇄</td> {res_bits.map((bit, i) => <td className="bitwiseValue" key={i} style={{backgroundColor: bit === "1" ? "lightgray" : "black", color: bit === "1" ? "black" : "white"}}>{bit}</td>)}</tr>
        </tbody></table></>    
}