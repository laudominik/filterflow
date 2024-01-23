import { useState, useContext, useSyncExternalStore, useEffect } from 'react'
import { faMagnifyingGlassPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {Button, FormSelect} from 'react-bootstrap';
import { FilterStoreContext } from '../../stores/simpleFilterStore';
import ConvolutionTransform from '../../engine/transforms/ConvolutionTransform';
import { GUID } from '../../engine/engine';

export default function PoolingComponent({guid}: {guid: GUID}){
    const filterContext = useContext(FilterStoreContext)

    const transform = useSyncExternalStore(filterContext.subscribe(guid) as any, filterContext.getTransform.bind(filterContext, guid))
    const [poolingSize, setPoolingSize] = useState<number>(transform.getParams()["pooling_size"])
    const [poolingStep, setPoolingStep] = useState<number>(transform.getParams()["pooling_step"])
    const handleSizeChange = (newSize: number) => {
        setPoolingSize(newSize);
        filterContext.updateParams(guid,
            {
                "pooling_size": newSize,
                "pooling_step": poolingStep
            }
        );
        filterContext.applyTransforms()
    };
    const handleStepChange = (newStep: number) => {
        setPoolingStep(newStep);
        filterContext.updateParams(guid,
            {
                "pooling_size": poolingSize,
                "pooling_step": newStep
            }
        );
        filterContext.applyTransforms()
    };

    return <div className="grid">
        <div>
            <label>
                Select pooling size:
            </label>

            <FormSelect value={poolingSize} onChange={(e) => handleSizeChange(parseInt(e.target.value, 10))}>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
            </FormSelect>
        </div>
        <div>
            <label>
                Select pooling stride:
            </label>
            <FormSelect value={poolingStep} onChange={(e) => handleStepChange(parseInt(e.target.value, 10))}>
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
            </FormSelect>
        </div>
        
    </div>
}