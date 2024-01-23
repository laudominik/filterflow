import { useState, useContext, useSyncExternalStore, useEffect } from 'react'
import { faMagnifyingGlassPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {Button, FormSelect} from 'react-bootstrap';
import { FilterStoreContext } from '../../stores/simpleFilterStore';
import ConvolutionTransform from '../../engine/transforms/ConvolutionTransform';
import { GUID } from '../../engine/engine';

export default function MorphoLogicComponent({guid}: {guid: GUID}){
    const filterContext = useContext(FilterStoreContext)

    const transform = useSyncExternalStore(filterContext.subscribe(guid) as any, filterContext.getTransform.bind(filterContext, guid))
    // NOTE: this (probably) forces entire component to reload, expertise is needed
    const selection = useSyncExternalStore(filterContext.subscribeCanvasSelections.bind(filterContext) as any, filterContext.getPreviewSelections.bind(filterContext))

    const [kernelSize, setKernelSize] = useState<[number, number]>(transform.getParams()["kernel_size"]);

    const handleKernelChange = (newKernelSize: [number, number]) => {
        setKernelSize(newKernelSize);
        transform.updateParams(
            {
                "kernel_size": newKernelSize
            }
        );
        filterContext.applyTransforms()
    };

    return <div className="grid">
        <label>
            Select Kernel Size:
            <input type="number" className="form-control" 
                value={kernelSize[0]} 
                onChange={(e) => handleKernelChange([parseInt(e.target.value),kernelSize[1]])}
            />
            x
            <input type="number" className="form-control" 
                value={kernelSize[1]} 
                onChange={(e) => handleKernelChange([kernelSize[0], parseInt(e.target.value)])}
            />
        </label>

    </div>
}