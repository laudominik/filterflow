import { useState, CSSProperties } from 'react'
import { faMagnifyingGlassPlus, faMagnifyingGlassMinus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {Button} from 'react-bootstrap';
import ImageMap from '../../util/ImageMap';

export function InputPreview({sourceId} : {sourceId : number}){
    return <Preview sourceId={sourceId} title="Input"/>;
}

export function OutputPreview({sourceId} : {sourceId : number}){
    return <Preview sourceId={sourceId} title="Output"/>;
}

function Preview({ title, sourceId } : {title: string, sourceId: number}){
    
    const [isFullscreen, setIsFullscreen] = useState(false);

    // TODO: get the image from external store by id
    const existingImagesJson = sessionStorage.getItem("images");
    const existingImages: ImageMap = existingImagesJson ? JSON.parse(existingImagesJson) : {};
    const imageUrl = existingImages[sourceId];

    return <div className="preview" style={componentStyle(isFullscreen)}>
         <div className="pipelineBar">
            <div>{title}</div>
            <Button className="border-0 bg-transparent" onClick={() => setIsFullscreen(!isFullscreen)}>
                <FontAwesomeIcon className="iconInCard" icon={isFullscreen ? faMagnifyingGlassMinus : faMagnifyingGlassPlus} />
            </Button>
        </div>
        <div className="centeredImage">
            <img src={imageUrl} alt="empty image" /> 
        </div>
    </div>
}

function componentStyle(isFullscreen: Boolean): CSSProperties {
    if(!isFullscreen) {
        return {};
    }
    return {
            position: "fixed",
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 9999
    };
}