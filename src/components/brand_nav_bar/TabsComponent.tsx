import { faCancel, faClose, faCross } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { Nav, Navbar } from "react-bootstrap";
import { useSessionStorage } from 'usehooks-ts'

export default function TabsComponent() {
    const [notebooks, setNotebooks] = useSessionStorage<Array<string>>("notebooks", [])
    const [selectedTabIx, setSelectedTabIx] = useSessionStorage<number>("selectedTabIx",0);

    function handleSelectNotebook(ix: number){
        setSelectedTabIx(ix)
    }

    function handleCloseNotebook(ix: number){
        // TODO: we should also remove serialized engines from session storage
        let newNotebooks = notebooks.slice(0, ix).concat(notebooks.slice(ix + 1))
        let newSelectedTabIx = selectedTabIx

        if(ix == selectedTabIx){
            newSelectedTabIx = 0;
        } else if(selectedTabIx > ix) {
            newSelectedTabIx = selectedTabIx - 1;
        }

        if (newNotebooks.length == 0){
            newNotebooks = [...newNotebooks, "New_notebook"]   
        }

        setNotebooks(newNotebooks)
        setSelectedTabIx(newSelectedTabIx)
    }

    function handleRenameNotebook(ix: number, event: React.FormEvent<HTMLSpanElement>){
        const newText = (event.target as HTMLSpanElement).textContent; 
        if(!newText) return;
        
        const updatedNotebooks = [
            ...notebooks.slice(0, ix), 
            newText, 
            ...notebooks.slice(ix + 1) 
        ];

        setNotebooks(updatedNotebooks)
    }

    function disallowNewlines(e: React.KeyboardEvent<HTMLSpanElement>){
        if (e.key === "Enter") {
            e.preventDefault();
        }
        //if (e.key == )
    }

    const tabStyle = {
        display: "inline", 
        paddingRight: "0.1vw",
        paddingBottom: "0.1vw",
    }

    return <Navbar.Collapse id="basic-navbar-nav">
    <Nav className="mr-auto">
        {notebooks.map((el, ix) => {
            return  <Nav.Link>
            <div  key={ix} style={tabStyle} onClick={() => handleSelectNotebook(ix)}>
                {
                    selectedTabIx == ix ? 
                    <span 
                    id={"notebook-tabname" + ix}
                    contentEditable={true} 
                    onKeyDown={disallowNewlines}
                    style={{border: 0, borderBottom: "0.1vw", borderStyle: "solid", height: "var(--navbar-height)", whiteSpace: "pre-wrap"}}
                    onInput={(e) => handleRenameNotebook(ix, e)}
                    dir="ltr"
                    suppressContentEditableWarning={true}
                    >
                    {el}
                    </span> 
                    : <span id={"notebook-tabname" + ix}
                   >{el}</span>
                }
            </div>
            <FontAwesomeIcon icon={faClose} onClick={() => handleCloseNotebook(ix)}/>
            </Nav.Link>
            }
        )}
    </Nav>
</Navbar.Collapse>
}