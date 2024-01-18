import { useState, useContext, useSyncExternalStore, useMemo, useEffect } from 'react';
import {Button} from 'react-bootstrap';
import { 
    faEye, 
    faEyeSlash, 
    faTrash,
    faCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Entry from './Entry';
import { Channel, FilterStoreContext } from '../../stores/simpleFilterStore';
import { GUID } from '../../engine/engine';

export default function TransformEntry({ guid }: { guid: GUID }){
    
    const filterStore = useContext(FilterStoreContext);
    const transform = useSyncExternalStore(filterStore.subscribe(guid) as any, filterStore.getTransform.bind(filterStore, guid))
    const preview = useSyncExternalStore(filterStore.subscribePreview.bind(filterStore) as any, filterStore.getPreview.bind(filterStore))
    const [enabled, setEnabled] = useState(transform.getEnabled());
    // const name = useSyncExternalStore(filterStore.subscribe(guid) as any, filterStore.getTransform(guid).getName.bind(transform))
    

    let [visualiation,setVisualisation] = useState(<>0</>);

    useEffect(()=>{
        if (preview.distance === 1 && preview.end === guid) {
            setVisualisation(transform.visualizationView(guid))
        }else{
            setVisualisation(<></>)
        }
    },[preview])
    
    
    const handleEyeClick = () => {
        const newState = !enabled;
        setEnabled(newState);
        filterStore.setEnabled(guid, newState);
    }

    const handleTrashClick = () => {
        filterStore.removeFromSequence(guid)
        filterStore.applyTransforms()
    }

    const handleChannelClick = (channel: Channel) => {
        filterStore.setPreview(guid, channel);
    }

    const handleExpansion = (expanded: boolean) => {
        transform.setExpanded(expanded)
        filterStore.commitToPersistentStore()
    }

    return <div key={guid} id={guid} style={{opacity: enabled ? '100%' : '60%'}}>
               <Entry color={transform.getColor()} initialOpen={transform.getExpanded()} openHook={handleExpansion}>
               <Entry.Header>{transform.name}</Entry.Header>
               <Entry.Body>
                    {transform.paramView(guid)}
                    {visualiation}
                </Entry.Body>
               <Entry.Icons>{icons(enabled, handleEyeClick, handleTrashClick, handleChannelClick)}</Entry.Icons>
            </Entry>
        </div>
        
 }

 function channels(channels: Channel[], colors: string[], handleChannelClick: (channel: Channel) => void){
    return channels.map((item, i) => <FontAwesomeIcon className="iconInCard" icon={faCircle} style={{color:colors[i]}} onClick={handleChannelClick.bind(i, item)}/>)
}
    
function icons(enabled: Boolean, handleEyeClick: () => void, handleTrashClick: () => void, handleChannelClick: (channel: Channel) => void){
    return <div key={crypto.randomUUID()}>
        <Button className='border-0 bg-transparent'>
            <FontAwesomeIcon onClick={handleEyeClick} className="iconInCard" icon={enabled ? faEye : faEyeSlash} />
        </Button>
        <Button className='border-0 bg-transparent'>
            <FontAwesomeIcon onClick={handleTrashClick} className="iconInCard" icon={faTrash} />
        </Button>
        <Button className='border-0 bg-transparent'>
            {channels([Channel.RED, Channel.GREEN, Channel.BLUE],["red", "green", "blue"], handleChannelClick)}
        </Button>
    </div>
}