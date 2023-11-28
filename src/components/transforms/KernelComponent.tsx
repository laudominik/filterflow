import { useState, useContext, useSyncExternalStore } from 'react'
import { faMagnifyingGlassPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {Button, FormSelect} from 'react-bootstrap';
import { FilterStoreContext } from '../../stores/simpleFilterStore';
import FilterTransform from '../../engine/transforms/FilterTransform';
import { GUID } from '../../engine/engine';

export default function KernelComponent({guid}: {guid: GUID}){
    const filterContext = useContext(FilterStoreContext)

    const transform = useSyncExternalStore(filterContext.subscribe(guid) as any, filterContext.getTransform.bind(filterContext, guid))
    
    const [gridValues, setGridValues] = useState<string[][]>(transform.getParams()["kernel"]);
    const [kernelN, setKernelN] = useState(gridValues.length);
    const handleKernelChange = (newKernelN: number) => {
        setKernelN(newKernelN);
        const newGridValues = Array(newKernelN).fill(0).map(() => new Array(newKernelN).fill(0))
        setGridValues(newGridValues)
        transform.updateParams(
            {
                "kernel": newGridValues
            }
        );
        filterContext.applyTransforms()
    };

    const handleInputChange = (row: number, col: number, value: string) => {
        const newGridValues = [...gridValues];
        newGridValues[row][col] = value;
        setGridValues(newGridValues)
        transform.updateParams(
            {
                "kernel": newGridValues
            }
        )
        filterContext.applyTransforms()
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