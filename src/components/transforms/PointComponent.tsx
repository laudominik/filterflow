import { useState, useContext, useSyncExternalStore, useEffect } from 'react'
import { faHand, faMagnifyingGlassPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {Button, FormSelect} from 'react-bootstrap';
import { FilterStoreContext } from '../../stores/simpleFilterStore';
import { GUID } from '../../engine/engine';

export default function PointComponent({guid, parametrized}: {guid: GUID, parametrized: boolean}){
    const filterContext = useContext(FilterStoreContext)

    const transform = useSyncExternalStore(filterContext.subscribe(guid) as any, filterContext.getTransform.bind(filterContext, guid))
    const [argument, setArgument] = useState(transform.getParams()["argument"]);

    const handleInputChange = (value: string) => {
        setArgument(value)
        transform.updateParams({
            "argument": value
        })

        filterContext.applyTransforms()
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