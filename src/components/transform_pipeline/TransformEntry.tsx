import { useState } from 'react';
import {Button} from 'react-bootstrap';
import { 
    faEye, 
    faEyeSlash, 
    faTrash,
    faCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Entry from './Entry';

export default function TransformEntry({ name }: { name: string }){
    const [enabled, setEnabled] = useState(true);
    
    const handleEyeClick = () => setEnabled(!enabled);

    return <div style={{opacity: enabled ? '100%' : '60%'}}>
               <Entry color="#E6F4E2">
               <Entry.Header>{name}</Entry.Header>
               <Entry.Body>Placeholder</Entry.Body>
               <Entry.Icons>{icons(enabled, handleEyeClick)}</Entry.Icons>
            </Entry>
        </div>
 
 }

 function channels(channels: string[]){
    return channels.map((item, _) => <FontAwesomeIcon className="iconInCard" icon={faCircle} style={{color:item}} />)
}
    
function icons(enabled: Boolean, handleEyeClick: () => void){
    return <div>
        <Button className='border-0 bg-transparent'>
            <FontAwesomeIcon onClick={handleEyeClick} className="iconInCard" icon={enabled ? faEye : faEyeSlash} />
        </Button>
        <Button className='border-0 bg-transparent'>
            <FontAwesomeIcon className="iconInCard" icon={faTrash} />
        </Button>
        <Button className='border-0 bg-transparent'>
            {channels(["red", "green", "blue"])}
        </Button>
    </div>
}