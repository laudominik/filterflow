import { InputPreview, OutputPreview } from "./Preview"

import "./Preview.css"

export default function PreviewContainer() {
    // TODO add logic of swaping active view
    const previewStart = 0;
    const previewEnd = 1;
    return <div className="previewContainer">
        <div style={{ flex: 1, height: '50%' }}><InputPreview sourceId={previewStart} /> </div>
        <div style={{ flex: 1, height: '50%' }}><OutputPreview sourceId={previewEnd} /> </div>
    </div>

}