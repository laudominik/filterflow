import { ChangeEvent } from "react";
import { Form, Nav, Navbar } from "react-bootstrap";
import { useSessionStorage } from "usehooks-ts";

export default function FileComponent() {
    const [notebooks, setNotebooks] = useSessionStorage<Array<string>>("notebooks", [])

    function handleNewNotebook(){
        let name = "New notebook";
        if(notebooks.includes(name)){
            name += "("
            let count = 1; 
            while(notebooks.includes(name + count + ")")) count++
            name += count + ")"
        }
        
        setNotebooks([...notebooks, name])        
    }

    function handleSaveNotebook(e: ChangeEvent<HTMLInputElement>){
        const file = e.target.files?.[0];
        if(!file) {
            return;
        }
        // TODO: save currently opened file under that name, appropriately change notebook name etc.
        console.log(file.name)
    }

    function handleLoadNotebook(e: ChangeEvent<HTMLInputElement>){
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            // TODO: add this loaded notebook

        }
        reader.readAsText(file);
    }

    return <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="mr-auto">
            <Nav.Link onClick={handleNewNotebook}>New</Nav.Link>
            <input
                type="file"
                id="saveNotebook"
                style={{ display: 'none' }}
                onChange={handleSaveNotebook}
            />
            <Nav.Link onClick={() => {document.getElementById("loadNotebook")?.click()}} type="file">Download</Nav.Link>
            <input
                type="file"
                id="loadNotebook"
                style={{ display: 'none' }}
                onChange={handleLoadNotebook}
            />
            <Nav.Link onClick={() => {document.getElementById("loadNotebook")?.click()}} type="file">Load</Nav.Link>
        </Nav>
    </Navbar.Collapse>

}