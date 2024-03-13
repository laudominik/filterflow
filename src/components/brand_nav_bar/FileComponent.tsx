import { ChangeEvent, useContext } from "react";
import { Form, Nav, Navbar } from "react-bootstrap";
import { useSessionStorage } from "usehooks-ts";
import { persistenceContext } from "../../stores/context";
import { serialize } from "v8";

export default function FileComponent() {
    const [notebooks, setNotebooks] = useSessionStorage<Array<string>>("notebooks", [])
    const [engines, setEngines] = useSessionStorage<Array<string>>("engines", [])
    const [selectedTabIx, setSelectedTabIx] = useSessionStorage<number>("selectedTabIx", 0)
    const persistence = useContext(persistenceContext)

    function handleNewNotebook(name: string = "New_notebook", serialized: string = ""){
        if(notebooks.includes(name)){
            name += "("
            let count = 1; 
            while(notebooks.includes(name + count + ")")) count++
            name += count + ")"
        }
        
        setNotebooks([...notebooks, name])        
        setEngines([...engines, serialized])
    }

    function handleSaveNotebook(){
        const data = persistence.save()
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
            const serialized = event.target?.result as string
            if(!serialized) return;
            const fileName = file.name.split('.').slice(0, -1).join('.');
            handleNewNotebook(fileName, serialized)
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