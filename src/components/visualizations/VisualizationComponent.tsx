import { useContext, useSyncExternalStore } from "react"
import { GUID } from "../../engine/engine"
import { FilterStoreContext } from "../../stores/simpleFilterStore"

export default function VisualizationComponent({guid}: {guid: GUID}){
    const filterContext = useContext(FilterStoreContext)

    const transform = useSyncExternalStore(filterContext.subscribe(guid) as any, filterContext.getTransform.bind(filterContext, guid))
    const selection = useSyncExternalStore(filterContext.subscribeCanvasSelections.bind(filterContext) as any, filterContext.getPreviewSelections.bind(filterContext))
}