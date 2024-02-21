import { ChangeEvent, useContext, useState, useSyncExternalStore } from "react";
import { GUID } from "../../engine/engine";
import { Card, CardBody, CardHeader, CardTitle, Form } from "react-bootstrap";
import { graphContext } from "../../stores/graphFilterStore";

import "../preview_container/Preview.css"
import GraphNode from "./GraphNode";

// todo: same component as regular GraphNode
export default function ImportGraphNode({ guid }: { guid: GUID }){    
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

    const img = <div className="imageContainer"><div className="centeredImage"><img src={imageDataUrl} /></div></div>

    return <GraphNode guid={guid}>
            <GraphNode.Body>{imageDataUrl ? img : form}</GraphNode.Body>
        </GraphNode>
    
}