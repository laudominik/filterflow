import { useContext, useSyncExternalStore } from "react";
import { InputPreview, OutputPreview } from "./Preview"
import { FilterStoreContext } from '../../stores/simpleFilterStore';

import "./Preview.css"

export default function PreviewContainer() {
    // TODO add logic of swaping active view
    const filterContext = useContext(FilterStoreContext);
    
    const previewStart = filterContext.source;
    const previewEnd = useSyncExternalStore(filterContext.subscribeSequence.bind(filterContext), filterContext.lastNode.bind(filterContext));
    return <div className="previewContainer">
        <div style={{ flex: 1, height: '50%' }}><InputPreview sourceId={previewStart} /> </div>
        <div style={{ flex: 1, height: '50%' }}><OutputPreview sourceId={previewEnd} /> </div>
    </div>

}