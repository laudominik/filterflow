import { useContext, useState, useSyncExternalStore } from "react";
import { GUID } from "../../engine/nodeResponse";
import { nodeStoreContext, previewStoreContext } from "../../stores/context";
import PreviewContainer from "../preview_container/PreviewContainer";
import { InputPreview, OutputPreview } from "../preview_container/Preview";

import "./GraphPreview.css";
import { Button, FormControl } from "react-bootstrap";
import { faArrowLeft, faArrowRight, faLeftLong, faRightLong } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import FormRange from "react-bootstrap/esm/FormRange";
import { CircleSwitch } from "../CircleSwitch";
import { Channel } from "../../stores/storeInterfaces";

export default function GraphPreview({guid, onBodyClick}: {guid: GUID, onBodyClick?: (e : React.MouseEvent)=>void}){
    
    const nodeContext = useContext(nodeStoreContext)    
    const node = nodeContext.getNode(guid)();
    let noInputs = node.value.meta.input_size;
    const pos = node.value.getPreviewPos();
    const [selectedInput, setSelectedInput] = useState(1)
    const colorsChannels = [Channel.RED, Channel.GREEN, Channel.BLUE];
    const previewContext = useContext(previewStoreContext);
    const previewStore = previewContext.getPreviewStore(guid)!;
    const previewSelections = useSyncExternalStore(previewStore.subscribeSelection.bind(previewStore) as any, previewStore.getSelection.bind(previewStore))

    function handleChooseChannel(channel: Channel){
        const selection = previewStore.getSelection()
        if(selection.channel == channel){
            channel = Channel.NONE
        }
        previewStore.updateSelection(selection.pointer, selection.preview, channel)
    }

    return <div id={"pr" + guid} style={{left: pos.x, top: pos.y}} onMouseDown={onBodyClick} className="draggable previewNode">
            <div className="previewNode">
                <div className="pipelineBar">
                    <div>{node.value.name} Preview</div> 
                    {noInputs == 1 ? <></> : <InputSelection selectedInput={selectedInput} setSelectedInput={setSelectedInput} noInputs={noInputs}/>}
                </div>
                {node.value.inputs.get(selectedInput - 1) ?
                <div><InputPreview sourceId={node.value.inputs.get(selectedInput - 1)![0]} previewName={guid} allowFullscreen={false}/></div> : <></>}
                <OutputPreview sourceId={guid} allowFullscreen={false}/>
                    <center>
                    <div className='border-0 bg-transparent'>
                            {
                                colorsChannels.map((item, i) => 
                                    <CircleSwitch key={i} color={item} state={previewSelections.channel == item} toggleState={() => {handleChooseChannel(item)}}/>
                                )
                            }
                    </div>
                    </center>
                    {previewSelections.channel != Channel.NONE ? node.value.visualizationView(guid) : <></>}
            </div>
         </div>
}

function InputSelection({selectedInput, setSelectedInput, noInputs} : {selectedInput: number, setSelectedInput: (_: number) => void, noInputs: number}){
    const decrement = () => {
        if(selectedInput == 1) return;
        setSelectedInput(selectedInput - 1);
    }

    const increment = () => {
        if(selectedInput == noInputs) return;
        setSelectedInput(selectedInput + 1);
    }

    const buttonStyle = {color: "black", display: "inline"};

    return <> 
        <Button className="border-0 bg-transparent fg-black" onClick={decrement} style={buttonStyle}><FontAwesomeIcon icon={faLeftLong} /></Button>
        <span>{selectedInput}/{noInputs}</span>
        <Button className="border-0 bg-transparent" onClick={increment} style={buttonStyle}><FontAwesomeIcon icon={faRightLong} /></Button>
    </>
}
