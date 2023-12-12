import { useState, useContext, useSyncExternalStore } from 'react';
import {Button} from 'react-bootstrap';
import { 
    faEye, 
    faEyeSlash, 
    faTrash,
    faCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Entry from './Entry';
import { FilterStoreContext } from '../../stores/simpleFilterStore';
import Transform from '../../engine/Transform';
import { GUID } from '../../engine/engine';

export default function TransformEntry({ guid }: { guid: GUID }){
    
    const filterStore = useContext(FilterStoreContext);
    const transform = useSyncExternalStore(filterStore.subscribe(guid) as any, filterStore.getTransform.bind(filterStore, guid))
    const [enabled, setEnabled] = useState(transform.getEnabled());

    
    const handleEyeClick = () => {
        const newState = !enabled;
        setEnabled(newState);
        transform.setEnabled(newState);
        filterStore.applyTransforms()
    }

    const handleTrashClick = () => {
        filterStore.removeFromSequence(guid)
        filterStore.applyTransforms()
    }

    const handleExpansion = (expanded: boolean) => {
        transform.setExpanded(expanded)
        filterStore.commitToPersistentStore()
    }

    return <div key={guid} id={guid} style={{opacity: enabled ? '100%' : '60%'}}>
               <Entry color={transform.getColor()} initialOpen={transform.getExpanded()} openHook={handleExpansion}>
               <Entry.Header>{transform.getName()}</Entry.Header>
               <Entry.Body>{transform.paramView(guid)}</Entry.Body>
               <Entry.Icons>{icons(enabled, handleEyeClick, handleTrashClick)}</Entry.Icons>
            </Entry>
        </div>
        
 }

 function channels(channels: string[]){
    return channels.map((item, _) => <FontAwesomeIcon className="iconInCard" icon={faCircle} style={{color:item}} />)
}
    
function icons(enabled: Boolean, handleEyeClick: () => void, handleTrashClick: () => void){
    return <div key={crypto.randomUUID()}>
        <Button className='border-0 bg-transparent'>
            <FontAwesomeIcon onClick={handleEyeClick} className="iconInCard" icon={enabled ? faEye : faEyeSlash} />
        </Button>
        <Button className='border-0 bg-transparent'>
            <FontAwesomeIcon onClick={handleTrashClick} className="iconInCard" icon={faTrash} />
        </Button>
        <Button className='border-0 bg-transparent'>
            {channels(["red", "green", "blue"])}
        </Button>
    </div>
}