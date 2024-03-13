import { faCancel, faClose, faCross } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext, useEffect, useState } from "react";
import { Nav, Navbar } from "react-bootstrap";
import { useSessionStorage } from 'usehooks-ts'

import "./TabsComponent.css"
import { persistenceContext } from "../../stores/context";

export default function TabsComponent() {
    const [notebooks, setNotebooks] = useSessionStorage<Array<string>>("notebooks", [])
    const [engines, setEngines] = useSessionStorage<Array<string>>("engines", [])
    const [selectedTabIx, setSelectedTabIx] = useSessionStorage<number>("selectedTabIx",0);
    const persistence = useContext(persistenceContext)

    function handleSelectNotebook(ix: number){
        persistence.saveToIndex(selectedTabIx)
        setSelectedTabIx(ix) 
        persistence.loadFromIndex(ix)
    }

    function handleCloseNotebook(ix: number){
        let newNotebooks = notebooks.slice(0, ix).concat(notebooks.slice(ix + 1))
        let newEngines = engines.slice(0, ix).concat(engines.slice(ix + 1))
        let newSelectedTabIx = selectedTabIx

        if(ix == selectedTabIx){
            newSelectedTabIx = 0;
        } else if(selectedTabIx > ix) {
            newSelectedTabIx = selectedTabIx - 1;
        }

        if (newNotebooks.length == 0){
            newNotebooks = ["New_notebook"]   
            newEngines = ["{}"]
        }

        setNotebooks(newNotebooks)
        setEngines(newEngines)
        setSelectedTabIx(newSelectedTabIx)
    }

    function handleRenameNotebook(ix: number, event: React.FormEvent<HTMLInputElement>){
        const newText = event.currentTarget.value; 
        console.log(newText)
        if(!newText) return;
        
        const updatedNotebooks = [
            ...notebooks.slice(0, ix), 
            newText, 
            ...notebooks.slice(ix + 1) 
        ];

        setNotebooks(updatedNotebooks)
    }

    const tabStyle = {
        display: "inline", 
        paddingRight: "0.1vw",
        paddingBottom: "0.1vw",
    }

    // border: 0;
    // border-style: solid;

    return <Navbar.Collapse id="basic-navbar-nav">
    <Nav className="mr-auto">
        {notebooks.map((el, ix) => {
            return  <Nav.Link key={ix} style={{cursor: "default"}}>
            <div  key={ix} style={tabStyle} onClick={() => handleSelectNotebook(ix)}>
                {
                    ix == selectedTabIx ? 
                    <input key={ix} type="text" className="tabText"
                    style={{
                        border: 0,
                        borderBottom: "0.1vw", 
                        borderStyle: "solid"}}
                    value={el}
                    minLength={1}
                    onChange={(e) => handleRenameNotebook(ix, e)}/> 
                    :
                    <input key={ix} type="text" className="tabText"
                    style={{
                        border: 0,
                        borderBottom: 0
                    }}
                    minLength={1}
                    value={el}
                    onChange={(e) => handleRenameNotebook(ix, e)}/> 
                }
            </div>
            <FontAwesomeIcon icon={faClose} onClick={() => handleCloseNotebook(ix)}/>
            </Nav.Link>
            }
        )}
    </Nav>
</Navbar.Collapse>
}