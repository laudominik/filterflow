import { useState, useContext, useSyncExternalStore, useEffect } from 'react'
import { faMagnifyingGlassPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {Button, FormSelect} from 'react-bootstrap';
import { FilterStoreContext } from '../../stores/simpleFilterStore';
import ConvolutionTransform from '../../engine/transforms/ConvolutionTransform';
import {GUID} from "../../engine/iengine";
import { nodeStoreContext } from '../../stores/context';


export default function KernelComponent({guid}: {guid: GUID}){
    const nodeContext = useContext(nodeStoreContext);
    const node = useSyncExternalStore(nodeContext.subscribeNode(guid), nodeContext.getNode(guid));

    // TODO: check if refresh component of selection change is needed
   
    const [gridValues, setGridValues] = useState<number[][]>(node.value.getParams()["kernel"]);
    const [kernelN, setKernelN] = useState(gridValues.length);
    const handleKernelChange = (newKernelN: number) => {
        setKernelN(newKernelN);
        const newGridValues = Array(newKernelN).fill(0).map(() => new Array(newKernelN).fill(0))
        setGridValues(newGridValues)
        node.value.updateParams({
            "kernel" : newGridValues
        })
    };

    const handleInputChange = (row: number, col: number, value: string) => {
        const newGridValues = [...gridValues];
        newGridValues[row][col] = parseInt(value);
        setGridValues(newGridValues);
        node.value.updateParams({
                "kernel": newGridValues
            }
        );
    };

    return <div className="grid">
        <label>
            Select Kernel Size:
            <FormSelect value={kernelN} onChange={(e) => handleKernelChange(parseInt(e.target.value, 10))}>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
            </FormSelect>
        </label>
        <div className="container mt-3">
            <label className="form-label">Enter NxN Grid Values:</label>
            <div className="row">
                {gridValues.map((row, rowIndex) => (
                    <div key={rowIndex} className="row mb-2">
                        {row.map((_, colIndex) => (
                            <div key={colIndex} className="col">
                                <input
                                    type="number"
                                    className="form-control"
                                    value={gridValues[rowIndex][colIndex]}
                                    onChange={(e) => handleInputChange(rowIndex, colIndex, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    </div>
}