export function CircleSwitch({color,state,toggleState}: {color:string,state: boolean,toggleState: Function}){
    return <div className={`iconInCard switch-container ${state? "active": ""}`} onClick={() => {toggleState()}}>
    <div className="switch-circle" style={{backgroundColor: color}}></div>
    <div className="switch-circle-center" style={{backgroundColor: color}}></div>
  </div>
}