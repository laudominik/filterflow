import { ChangeEvent, useContext } from "react";
import { Form, Nav, Navbar } from "react-bootstrap";
import { useSessionStorage } from "usehooks-ts";
import { notebookStoreContext } from "../../stores/context";
import { serialize } from "v8";

export default function FileComponent() {    
    const notebookStore = useContext(notebookStoreContext)

    function handleNewNotebook(){
        notebookStore.newNotebook();
    }

    function handleSaveNotebook(){
        const data = notebookStore.saveNotebook()
        const blob = new Blob([data], {type:""})
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download =  notebookStore.getSelectedName() + ".ffnb"
    
        link.click();
        URL.revokeObjectURL(url);
    }

    function handleLoadNotebook(e: ChangeEvent<HTMLInputElement>){
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            const serialized = event.target?.result as string
            if(!serialized) return;
            const fileName = file.name.split('.').slice(0, -1).join('.');
            notebookStore.loadNotebook(fileName,serialized);
        }
        reader.readAsText(file);
    }

    return <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="mr-auto">
            <Nav.Link onClick={handleNewNotebook}>New</Nav.Link>
            <Nav.Link onClick={handleSaveNotebook}>Download</Nav.Link>

            <input
                type="file"
                accept=".ffnb"
                id="loadNotebook"
                style={{ display: 'none' }}
                onChange={handleLoadNotebook}
            />
            <Nav.Link onClick={() => {document.getElementById("loadNotebook")?.click()}} type="file">Load</Nav.Link>
        </Nav>
    </Navbar.Collapse>

}