import { faProjectDiagram, faTimeline } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";


export default function EngineModeSwitch(){
    
    const [modeGraph, setModeGraph] = useState(false)
    function HandleClick() {
        setModeGraph(!modeGraph);
        let newMode = modeGraph ? "pipeline" : "graph"
        sessionStorage.setItem("engineMode", newMode)
        window.dispatchEvent(new Event("storage"));
        /*
            TBD: should take into account session storage state
            e.g. clear it or maybe keep two separate states:
            - pipeline state
            - graph state
        */
    }

    useEffect(()=>{
        let currentMode = sessionStorage.getItem("engineMode")
        if(currentMode){
            setModeGraph(currentMode === "graph")
        }
    }, [])

    return <div className="navModeButton" onClick={()=>HandleClick()} title={`${modeGraph ? 'Linear (pipeline)' : 'Graph' } view`}><FontAwesomeIcon icon={modeGraph ? faProjectDiagram : faTimeline}/></div>

}