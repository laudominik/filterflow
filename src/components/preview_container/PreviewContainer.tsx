import { InputPreview, OutputPreview } from "./Preview"
import SplitPane from 'react-split-pane'; 

import "./Preview.css"

export default function PreviewContainer(){
    return  <div className="previewContainer">
                <div style={{flex: 1, height: '50%'}}><InputPreview sourceId={1}/> </div>
                <div style={{flex: 1, height: '50%'}}><OutputPreview sourceId={1}/> </div>
            </div>
               
}