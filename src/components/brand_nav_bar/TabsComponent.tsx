import { faCancel, faClose, faCross } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { Nav, Navbar } from "react-bootstrap";

export default function TabsComponent() {

    // TODO: get open notebooks from session storage
    const [notebooks, setNotebooks] = useState<Array<string>>([]);

    useEffect(()=>{
        const nbs = sessionStorage.getItem("notebooks");
        if(nbs){
            // TODO setNotebooks should take just names
            setNotebooks(JSON.parse(nbs));
        }
    }, [])

    function handleCloseNotebook(){
        // TODO notebook closes

    }

    const tabStyle = {
        display: "inline", 
        paddingRight: "0.1vw",
    }

    return <Navbar.Collapse id="basic-navbar-nav">
    <Nav className="mr-auto">
        {notebooks.map((el, ix) => {
            // TODO: determine, which one is selected
            return  <Nav.Link style={{borderLeftWidth: ix == 0 ? "0.1vw" : 0, borderStyle: "solid", borderRightWidth: "0.1vw"}}>
            <div style={tabStyle} >{el}</div><FontAwesomeIcon icon={faClose} onClick={handleCloseNotebook}/>
            </Nav.Link>
            }
        )}
    </Nav>
</Navbar.Collapse>
}