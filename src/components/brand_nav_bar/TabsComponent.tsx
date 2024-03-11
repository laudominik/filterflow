import { faCancel, faClose, faCross } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { Nav, Navbar } from "react-bootstrap";
import { useSessionStorage } from 'usehooks-ts'

export default function TabsComponent() {

    // TODO: get open notebooks from session storage
    const [notebooks, setNotebooks] = useSessionStorage<Array<string>>("notebooks", [])
    //const [notebooks, setNotebooks] = useState<Array<string>>([]);
    const [selectedTabIx, setSelectedTabIx] = useSessionStorage<number>("selectedTabIx",0);

    useEffect(()=>{
        const nbs = sessionStorage.getItem("notebooks");
        if(nbs){
            // TODO setNotebooks should take just names
            setNotebooks(JSON.parse(nbs));
        }
    }, [])

    function handleSelectNotebook(ix: number){
        setSelectedTabIx(ix)
        //sessionStorage.setItem("selectedTabIx", JSON.stringify(ix))
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
            newNotebooks = [...newNotebooks, "New notebook"]   
        }

        
        setNotebooks(newNotebooks)
        setSelectedTabIx(newSelectedTabIx)
    }

    function handleRenameNotebook(){

    }

    const tabStyle = {
        display: "inline", 
        paddingRight: "0.1vw",
        paddingBottom: "0.1vw",
    }

    // style={{borderLeftWidth: ix == 0 ? "0.1vw" : 0, borderStyle: "solid", borderRightWidth: "0.1vw"}}
    return <Navbar.Collapse id="basic-navbar-nav">
    <Nav className="mr-auto">
        {notebooks.map((el, ix) => {
            // TODO: determine, which one is selected
            return  <Nav.Link>
            <div  key={ix} style={tabStyle} onClick={() => handleSelectNotebook(ix)}>
                {
                    selectedTabIx == ix ? 
                    <span key={ix} style={{border: 0, borderBottom: "0.1vw", borderStyle: "solid", height: "var(--navbar-height)"}}>
                    {el}</span> : <span key={ix}>{el}</span>
                }
                
            </div>
            <FontAwesomeIcon icon={faClose} onClick={() => handleCloseNotebook(ix)}/>
            </Nav.Link>
            }
        )}
    </Nav>
</Navbar.Collapse>
}