import { ChangeEvent } from "react";
import { Form, Nav, Navbar } from "react-bootstrap";
import { useSessionStorage } from "usehooks-ts";

export default function FileComponent() {
    const [notebooks, setNotebooks] = useSessionStorage<Array<string>>("notebooks", [])
    const [selectedTabIx, setSelectedTabIx] = useSessionStorage<number>("selectedTabIx", 0)

    function handleNewNotebook(name: string = "New_notebook"){
        if(notebooks.includes(name)){
            name += "("
            let count = 1; 
            while(notebooks.includes(name + count + ")")) count++
            name += count + ")"
        }
        
        setNotebooks([...notebooks, name])        
    }

    function handleSaveNotebook(){
        const data = "https://www.youtube.com/watch?v=oHg5SJYRHA0" // TODO: change that to serialized engine
        const blob = new Blob([data], {type:""})
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = notebooks[selectedTabIx] + ".ffnb"
    
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
            // TODO: deserialize engine and add it to storage
            const fileName = file.name.split('.').slice(0, -1).join('.');
            handleNewNotebook(fileName)
        }
        reader.readAsText(file);
    }

    return <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="mr-auto">
            <Nav.Link onClick={() => handleNewNotebook()}>New</Nav.Link>
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