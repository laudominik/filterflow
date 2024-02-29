import { useContext } from "react";
import { GUID } from "../../engine/nodeResponse";
import { nodeStoreContext } from "../../stores/context";
import PreviewContainer from "../preview_container/PreviewContainer";

export default function GraphPreview({guid, onBodyClick}: {guid: GUID, onBodyClick?: (e : React.MouseEvent)=>void}){
    const nodeContext = useContext(nodeStoreContext)    
    const pos = nodeContext.getNode(guid)().value.getPreviewPos();

    return <div id={"pr" + guid} style={{left: pos.x, top: pos.y}} onMouseDown={onBodyClick} className="draggable previewNode"> <PreviewContainer /></div>
}