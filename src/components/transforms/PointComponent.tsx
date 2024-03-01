import { useState, useContext, useSyncExternalStore, useEffect } from 'react'
import { faHand, faMagnifyingGlassPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {Button, FormSelect} from 'react-bootstrap';
import { FilterStoreContext } from '../../stores/simpleFilterStore';
import { GUID } from '../../engine/engine';
import { nodeStoreContext } from '../../stores/context';
import { previewStoreContext } from '../../stores/context';

export default function PointComponent({guid, parametrized}: {guid: GUID, parametrized: boolean}){    
    const nodeContext = useContext(nodeStoreContext);
    const node = useSyncExternalStore(nodeContext.subscribeNode(guid), nodeContext.getNode(guid));

    const [argument, setArgument] = useState(node.value.getParams()["argument"]);

    const handleInputChange = (value: string) => {
        setArgument(value)
        nodeContext.updateParam(guid, {
            "argument" : value
        })
    };

    if(parametrized){
        return <div className="grid">
            <label>
                Argument:
                <input                  type="number"
                                        className="form-control"
                                        value={argument}
                                        onChange={(e) => handleInputChange(e.target.value)}
                                    />
            </label>
        </div>
    } else {
        return <div>no parameters to specify</div>
    }   
}