import { ChangeEvent } from 'react'
import { Form } from 'react-bootstrap';
import ImageMap from '../../util/ImageMap';
import Entry from "./Entry"
import { useContext } from "react"
import { FilterStoreContext } from '../../stores/simpleFilterStore';
export default function ImportEntry() {
    return <Entry color="black" invert>
        <Entry.Header>Import</Entry.Header>
        <Entry.Body><ImageUploadForm /></Entry.Body>
    </Entry>
}

function ImageUploadForm() {
    const filterContext = useContext(FilterStoreContext)

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const imageDataUrl = event.target?.result as string;
            filterContext.setSource(imageDataUrl)
            filterContext.applyTransforms()
        }
        
        reader.readAsDataURL(file);
    }

    return <Form>
        <Form.Group controlId="formFile" className="mb-3">
            <Form.Label>Choose an image</Form.Label>
            <Form.Control type="file" onChange={handleImageChange} />
        </Form.Group>
    </Form>
}

