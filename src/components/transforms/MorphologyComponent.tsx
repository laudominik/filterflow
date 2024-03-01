import { useState, useContext, useSyncExternalStore, useEffect } from 'react'
import { faMagnifyingGlassPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {Button, FormSelect} from 'react-bootstrap';
import { FilterStoreContext } from '../../stores/simpleFilterStore';
import ConvolutionTransform from '../../engine/transforms/ConvolutionTransform';
import { GUID } from '../../engine/engine';
import { nodeStoreContext } from '../../stores/context';

export default function MorphoLogicComponent({guid}: {guid: GUID}){
    const nodeContext = useContext(nodeStoreContext);
    const node = useSyncExternalStore(nodeContext.subscribeNode(guid), nodeContext.getNode(guid));    
    // TODO: check if refresh component of selection change is needed

    const [kernelSize, setKernelSize] = useState<[number, number]>(node.value.getParams()["kernel_size"]);

    const handleKernelChange = (newKernelSize: [number, number]) => {
        setKernelSize(newKernelSize);

        nodeContext.updateParam(guid,
            {
                "kernel_size": newKernelSize
            }
        );
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