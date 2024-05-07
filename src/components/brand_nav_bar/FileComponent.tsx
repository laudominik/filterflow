import {ChangeEvent, useContext} from "react";
import {Form, Nav, Navbar} from "react-bootstrap";
import {useSessionStorage} from "usehooks-ts";
import {notebookStoreContext} from "../../stores/context";
import {serialize} from "v8";
import {useCommand} from "../../util/commands";
import {ImageStore} from "../../stores/imageStore";

export default function FileComponent() {
    const notebookStore = useContext(notebookStoreContext)


    useCommand({
        name: "New notebook",
        description: "Opens new notebook",
        callback: handleNewNotebook,
        binding: ["Shift", "N"]
    })

    useCommand({
        name: "Download notebook",
        description: "Downloads active notebook",
        callback: handleSaveNotebook,
        binding: ["Shift", "W"]
    })

    function handleNewNotebook() {
        notebookStore.newNotebook();
    }

    async function handleSaveNotebook() {
        const data = notebookStore.saveNotebook()
        const imageList = ImageStore.getImageList()
        const imageDataList: string[] = []
        for (let imageHash of imageList) {
            const imageData = await ImageStore.get(imageHash)
            imageDataList.push(imageData!)
        }
        const obj = {
            'notebook': data,
            'imageList': imageList,
            'imageDataList': imageDataList
        }

        const blob = new Blob([JSON.stringify(obj)], {type: ""})
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = notebookStore.stores[notebookStore.getSelectedIx()][0] + ".ffnb"

        link.click();
        URL.revokeObjectURL(url);
    }

    function handleLoadNotebook(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            const serialized = event.target?.result as string
            if (!serialized) return;
            const fileName = file.name.split('.').slice(0, -1).join('.');
            const obj = JSON.parse(serialized)
            const name = notebookStore.availableName(fileName)

            for (let i = 0; i < obj['imageList'].length; i++) {
                const hash = obj['imageList'][i]
                const data = obj['imageDataList'][i]
                ImageStore.add(data, name, hash)
            }

            notebookStore.loadNotebook(fileName, obj['notebook']);
        }
        reader.readAsText(file);
    }

    return <Nav className="mr-auto">
        <Nav.Link onClick={handleNewNotebook}>New</Nav.Link>
        <Nav.Link onClick={handleSaveNotebook}>Download</Nav.Link>

        <input
            type="file"
            accept=".ffnb"
            id="loadNotebook"
            style={{display: 'none'}}
            onChange={handleLoadNotebook}
        />
        <Nav.Link onClick={() => {document.getElementById("loadNotebook")?.click()}} type="file">Load</Nav.Link>
    </Nav>
}