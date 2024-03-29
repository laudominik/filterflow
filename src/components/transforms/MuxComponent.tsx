import { useState, useContext, useSyncExternalStore, useEffect } from 'react'
import { faHand, faMagnifyingGlassPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {Button, Form, FormSelect} from 'react-bootstrap';
import { FilterStoreContext } from '../../stores/simpleFilterStore';
import { GUID } from '../../engine/engine';
import { nodeStoreContext } from '../../stores/context';
import { previewStoreContext } from '../../stores/context';

const maxMuxInputs = 5;

export default function MuxComponent({guid}: {guid: GUID}){    
    const nodeContext = useContext(nodeStoreContext);
    const node = useSyncExternalStore(nodeContext.subscribeNode(guid), nodeContext.getNode(guid));

    // const [selected, setSelected] = useState(node.value.getParams()["selected"]);
    // const [muxedInputs, setMuxedInputs] = useState(node.value.getParams()["muxedInputs"]);

    const selected = node.value.getParams()["selected"]
    const muxedInputs = node.value.getParams()["muxedInputs"];

    const handleSelectedChange = (value: string) => {
        const iVal = Number.parseInt(value)
        // setSelected(iVal)
        nodeContext.updateParam(guid, {
            "selected" : iVal
        })
    };

    // TODO: it doesn't update :\
    const handleMuxedInputsChange = (value: string) => {
        const iVal = Number.parseInt(value)
        if(iVal < 1 || iVal > maxMuxInputs) return;
        // setMuxedInputs(iVal);
        nodeContext.updateParam(guid, {
            "muxedInputs": iVal
        })
    }

    return <div className="grid">
        <div>
            <label>
                Muxed inputs:
                <input                  type="number"
                                        className="form-control"
                                        value={muxedInputs}
                                        onChange={(e) => handleMuxedInputsChange(e.target.value)}
                                    />
            </label>
        </div>
        <label>
            Selected input
            <div key={`inline-radio-${guid}`} className="mb-3">
                {
                    [...Array(muxedInputs)].map((_, ix) => {
                        return <Form.Check
                        inline
                        label={`${ix + 1}`}
                        key={`group-${guid}-${ix}`}
                        type="radio"
                        value={ix}
                        checked={selected == ix}
                        onChange={(e) => handleSelectedChange(e.target.value)}
                        />
                    })

                }
            </div>            
        </label>
    </div>
    
}