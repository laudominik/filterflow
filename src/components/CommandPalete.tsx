import { useContext } from "react"
import { CommandContext } from "../util/commands"


// WIP: a command palete with fuzzy search that displays all registered (including non-binded) commands
export default function CommandPalete(){

    const commandRegistry = useContext(CommandContext)
    

    return <div className="mod" style={{ position: "absolute", margin: "auto auto", left: 0, right: 0, top: 0, bottom: 0, zIndex:"100",  width:"10vw", height:"10vh", backgroundColor:"red"}}>
        <div className="head">
            <input></input>
        </div>
        <div className="result">
            {Array.from(commandRegistry.getCommands().values()).map(v => <div>command: {v.name}</div>)}
        </div>
    </div>
}