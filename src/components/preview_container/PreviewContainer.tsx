import { InputPreview, OutputPreview } from "./Preview"
import SplitPane from 'react-split-pane'; 

export default function PreviewContainer(){
            // @ts-ignore
    return  <SplitPane split="horizontal" className='splitPane' minSize={50} size={80}>
                <InputPreview sourceId={0}/>
                <OutputPreview sourceId={1}/>
            </SplitPane> 
}