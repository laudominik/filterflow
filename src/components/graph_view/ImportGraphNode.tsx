import { ChangeEvent, useContext, useState, useSyncExternalStore } from "react";
import { GUID } from "../../engine/engine";
import { Card, CardBody, CardHeader, CardTitle, Form } from "react-bootstrap";
import "../preview_container/Preview.css"
import "./GraphNode.css"
import GraphNode, { IOFunctionType } from "./GraphNode";

// todo: same component as regular GraphNode
export default function ImportGraphNode({ guid, style, onBodyClick, ioFunction }: { guid: GUID, style: React.CSSProperties, onBodyClick?: (e : React.MouseEvent)=>void, ioFunction?: IOFunctionType }){    
    const [imageDataUrl, setImageDataUrl] = useState("")
    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            setImageDataUrl(event.target?.result as string)
            // TODO: graph context set source node with that guid
        }
        
        reader.readAsDataURL(file);
    }

    const form = <Form>       
        <Form.Group controlId="formFile" className="mb-3">
            <Form.Label>Choose an image</Form.Label>
            <Form.Control type="file" onChange={handleImageChange} />
        </Form.Group>
    </Form>

    const img = <div className="imageContainer"><div className="centeredImage"><img className="image-boundaries" src={imageDataUrl} /></div></div>

    return <GraphNode guid={guid} onBodyClick={onBodyClick} style={style} ioFunction={ioFunction}>
            {imageDataUrl ? img : form}
        </GraphNode>
    
}