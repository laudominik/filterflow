import { faMagnifyingGlassPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {Button} from 'react-bootstrap';

export function InputPreview({sourceId} : {sourceId : number}){
    return <Preview sourceId={sourceId} title="Input"/>;
}

export function OutputPreview({sourceId} : {sourceId : number}){
    return <Preview sourceId={sourceId} title="Output"/>;
}

function Preview({ title, sourceId } : {title: string, sourceId: number}){
    return <div className="preview">
         <div className="pipelineBar">
            <div>{title}</div>
            <Button className="border-0 bg-transparent">
                <FontAwesomeIcon className="iconInCard" icon={faMagnifyingGlassPlus} />
            </Button>
        </div>
        <div className="centeredImage">
            <img src="https://images.genius.com/c62725074ed6d8b738cfa4263d28e3fb.900x900x1.jpg" alt="alternatetext" /> 
        </div>
    </div>
}