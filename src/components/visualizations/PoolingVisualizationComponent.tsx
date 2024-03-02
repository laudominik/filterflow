import { ReactNode, useContext, useSyncExternalStore } from "react"
import { GUID } from "../../engine/engine"
import { Channel, ChannelValue, FilterStoreContext } from "../../stores/simpleFilterStore"
import PixelComponent, { ColorComponent } from "./PixelComponent"
import AdnotateElement, { AdnotateText } from "./AdnotationComponent"
import './Matrix.css'

export default function PoolingVisualizationComponent({guid, type, reduction}: {guid: GUID, type:string, reduction: (...values: number[]) => number}) {
    
    // TODO : change API


    const filterContext = useContext(FilterStoreContext)
    
    const preview = useSyncExternalStore(filterContext.subscribePreview.bind(filterContext) as any, filterContext.getPreview.bind(filterContext))
    const transform = useSyncExternalStore(filterContext.subscribe(guid) as any, filterContext.getTransform.bind(filterContext, guid))
    const selection = useSyncExternalStore(filterContext.subscribeCanvasSelections.bind(filterContext) as any, filterContext.getPreviewSelections.bind(filterContext))

    const pixels = filterContext.getTransform(preview.start).getPixels(selection.source.start, selection.source.size)
    const res_pixel = transform.getPixels(selection.destination.start, selection.destination.size)
    const channelOffset = ChannelValue[preview.visualizationChannel]

    const poolingSize = transform.params["pooling_size"]
    
    const values = [...Array(poolingSize)].map((_, i) => {
        return [... Array(poolingSize)].map((_,ii) => {
            let pos = ((poolingSize-i-1)*poolingSize + ii)*4
            return pixels[pos + channelOffset]
        })
    })

    const funcResult = reduction(...values.map(el => reduction(...el)))

    return <>
        <hr/>
        {drawPixelValues(values, preview.visualizationChannel)}
        {AdnotateElement(<>=</>, type, "under")} {ColorComponent(funcResult, preview.visualizationChannel)}
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