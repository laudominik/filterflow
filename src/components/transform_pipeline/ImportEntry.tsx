import { ChangeEvent } from 'react'
import { Form } from 'react-bootstrap';
import ImageMap from '../../util/ImageMap';
import Entry from "./Entry"

export default function ImportEntry(){
    return <Entry color="black" invert>
        <Entry.Header>Import</Entry.Header>
        <Entry.Body><ImageUploadForm/></Entry.Body>
    </Entry> 
}

function ImageUploadForm(){
        const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if(!file){
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const imageDataUrl = event.target?.result as string;
                const imageId = 1; // TODO: query engine for an unique id

                const existingImagesJson = sessionStorage.getItem("images");
                const existingImages: ImageMap = existingImagesJson ? JSON.parse(existingImagesJson) : {};
                existingImages[imageId] = imageDataUrl;
                sessionStorage.setItem("images", JSON.stringify(existingImages));
            }

            reader.readAsDataURL(file);
        }
   
        return  <Form>
                    <Form.Group controlId="formFile" className="mb-3">
                        <Form.Label>Choose an image</Form.Label>
                        <Form.Control type="file" onChange={handleImageChange} />
                    </Form.Group>
                </Form>
}

