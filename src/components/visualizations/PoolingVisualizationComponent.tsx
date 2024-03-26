import { ReactNode, useContext, useSyncExternalStore } from "react"
import { GUID } from "../../engine/engine"
import { Channel, ChannelValue, FilterStoreContext } from "../../stores/simpleFilterStore"
import PixelComponent, { ColorComponent } from "./PixelComponent"
import AdnotateElement, { AdnotateText } from "./AdnotationComponent"
import './Matrix.css'
import { nodeStoreContext, previewStoreContext } from "../../stores/context"

export default function PoolingVisualizationComponent({guid, type, reduction}: {guid: GUID, type:string, reduction: (...values: number[]) => number}) {
    
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

    const inputNode =  useSyncExternalStore(nodeContext.subscribeNode(inputId), nodeContext.getNode(inputId));
    const pixels = inputNode.value.getPixels(selection.preview.source.start, selection.preview.source.size);
    const res_pixel = node.value.getPixels(selection.preview.destination.start, selection.preview.destination.size);
    const channelOffset = ChannelValue[selection.channel]

    const poolingSize = node.value.params["pooling_size"]
    
    const values = [...Array(poolingSize)].map((_, i) => {
        return [... Array(poolingSize)].map((_,ii) => {
            let pos = ((poolingSize-i-1)*poolingSize + ii)*4
            return pixels[pos + channelOffset]
        })
    })

    function mapChannel(channel: Channel){
        switch(channel){
            case Channel.RED:
                return 0;
            case Channel.GREEN:
                return 1;
            case Channel.BLUE:
                return 2;
            default:
                return 0;
        }
    }

    return <>
        <hr/>
        {drawPixelValues(values, selection.channel)}
        {AdnotateElement(<>=</>, type, "under")} {ColorComponent(res_pixel[mapChannel(selection.channel)], selection.channel)}
        <br/>
    </>    
}

function drawPixelValues(pixels: number[][], channel: Channel){
    return <table className="matrix">{
        pixels.map((el,key) =>{
            return <tr key={key}>{
                el.map((ell,key) => {
                    return <td key={key}>{ColorComponent(ell, channel)}</td>
                })
            }</tr>
        })
    }</table>
 
}