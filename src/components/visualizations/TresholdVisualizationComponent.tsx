import { ReactNode, useContext, useSyncExternalStore } from "react"
import { GUID } from "../../engine/engine"
import { FilterStoreContext } from "../../stores/simpleFilterStore"
import PixelComponent from "./PixelComponent"

export default function TresholdVisualizationComponent({guid}: {guid: GUID}) {
    const filterContext = useContext(FilterStoreContext)
    
    const preview = useSyncExternalStore(filterContext.subscribePreview.bind(filterContext) as any, filterContext.getPreview.bind(filterContext))
    const transform = useSyncExternalStore(filterContext.subscribe(guid) as any, filterContext.getTransform.bind(filterContext, guid))
    const selection = useSyncExternalStore(filterContext.subscribeCanvasSelections.bind(filterContext) as any, filterContext.getPreviewSelections.bind(filterContext))
    // TODO: update when params changed
    
    // TODO: optimize pixel allocation
    const pixels = filterContext.getTransform(preview.start).getPixels(selection.source.start, selection.source.size)

    const rgb: [number, number, number] = [pixels[0],pixels[1], pixels[2]]
    const red: number = pixels[0]
    const treshold: number = transform.params["argument"]
    const res: number = 255 * (red > treshold ? 1 : 0)    
    return <>{PixelComponent([255,255,255], preview.channel)} * ({PixelComponent(rgb, preview.channel)} {">"} {treshold}) = {PixelComponent([res, res, res],preview.channel)}</>    
}