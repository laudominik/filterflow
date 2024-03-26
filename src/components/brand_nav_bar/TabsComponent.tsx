import { faCancel, faClose, faCross } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext, useEffect, useState, useSyncExternalStore } from "react";
import { Nav, Navbar } from "react-bootstrap";
import { useSessionStorage } from 'usehooks-ts'

import "./TabsComponent.css"
import { notebookStoreContext } from "../../stores/context";

export default function TabsComponent() {
    const notebooksContext = useContext(notebookStoreContext)
    const selectedNotebook = useSyncExternalStore(notebooksContext.subscribeSelected.bind(notebooksContext),notebooksContext.getSelectedIx.bind(notebooksContext))
    const _ = useSyncExternalStore(notebooksContext.subscribeNotebookCollection.bind(notebooksContext), notebooksContext.getNotebookCollection.bind(notebooksContext))

    function handleSelectNotebook(ix: number){
        notebooksContext.changeNotebook(ix);
    }

    function handleCloseNotebook(ix: number){
        notebooksContext.deleteNotebook(ix);    
    }

    function handleRenameNotebook(ix: number, event: React.FormEvent<HTMLInputElement>){
        const newText = event.currentTarget.value;
        notebooksContext.renameNotebook(ix, newText);
    }

    const tabStyle = {
        display: "inline", 
        paddingRight: "0.1vw",
        // paddingBottom: "0.1vw",
        backgroundColor: "lightgray"
    }

    return <Nav className="mr-auto">
        {notebooksContext.stores.map( (el, ix) => {
            const name = `${el[0]}`;
            return  <Nav.Link key={name} style={{cursor: "default"}}>
            <div style={tabStyle} onClick={() => handleSelectNotebook(ix)}>
                {
                    ix === selectedNotebook ? 
                    <input type="text" className="tabText"
                    style={{
                        border: 0,
                        borderBottom: "0.2vw", 
                        borderStyle: "solid"}}
                    value={name}
                    onChange={(e) => handleRenameNotebook(ix, e)}
                    autoFocus/> 
                    :
                    <input type="text" className="tabText"
                    style={{
                        border: 0,
                        borderBottom: 0
                    }}
                    value={name}
                    onChange={(e) => handleRenameNotebook(ix, e)}/> 
                }
            </div>
            <FontAwesomeIcon icon={faClose} onClick={() => handleCloseNotebook(ix)}/>
            </Nav.Link>
            }
        )}
    </Nav>
}