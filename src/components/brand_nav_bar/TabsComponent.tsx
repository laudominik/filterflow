import {faCancel, faClose, faCross} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {useContext, useEffect, useState, useSyncExternalStore} from "react";
import {Nav, Navbar} from "react-bootstrap";
import {useSessionStorage} from 'usehooks-ts'

import "./TabsComponent.css"
import {notebookStoreContext} from "../../stores/context";
import {useCommand} from "../../util/commands";

export default function TabsComponent() {
    const notebooksContext = useContext(notebookStoreContext)
    const selectedNotebook = useSyncExternalStore(notebooksContext.subscribeSelected.bind(notebooksContext), notebooksContext.getSelectedIx.bind(notebooksContext))
    const _ = useSyncExternalStore(notebooksContext.subscribeNotebookCollection.bind(notebooksContext), notebooksContext.getNotebookCollection.bind(notebooksContext))
    const [cursorPos, setCursorPos] = useState(notebooksContext.stores[0][0].length)

    useCommand({
        name: "Close active notebook",
        description: "Closes currently active notebook",
        callback: handleCloseActiveNotebook,
        binding: ["Shift", "Q"]
    })

    useEffect(() => {
        const el = document.getElementById("selectednbinput") as HTMLInputElement
        if (!el) return;
        el.setSelectionRange(cursorPos, cursorPos)
    }, [cursorPos, _])

    function handleSelectNotebook(ix: number) {
        notebooksContext.changeNotebook(ix);
        setCursorPos(notebooksContext.stores[ix][0].length)
    }

    function handleCloseNotebook(ix: number) {
        notebooksContext.deleteNotebook(ix);
    }

    function handleCloseActiveNotebook() {
        handleCloseNotebook(selectedNotebook)
    }

    function handleRenameNotebook(ix: number, event: React.FormEvent<HTMLInputElement>) {
        const newText = event.currentTarget.value;
        notebooksContext.renameNotebook(ix, newText);
        const el = document.getElementById("selectednbinput") as HTMLInputElement
        if (!el) return;
        if (!el.selectionStart) {
            setCursorPos(0)
            return;
        }
        setCursorPos(el.selectionStart)
    }

    const tabStyle = {
        display: "inline",
        paddingRight: "0.1vw",
        // paddingBottom: "0.1vw",
        backgroundColor: "lightgray"
    }

    return <Nav className="mr-auto">
        {notebooksContext.stores.map((el, ix) => {
            const name = `${el[0]}`;
            return <Nav.Link key={ix} style={{cursor: "default"}}>
                <div style={tabStyle} onClick={() => handleSelectNotebook(ix)}>
                    {
                        ix === selectedNotebook ?
                            <input id="selectednbinput" type="text" className="tabText"
                                style={{
                                    border: 0,
                                    borderBottom: "0.2vw",
                                    borderStyle: "solid"
                                }}
                                value={name}
                                onChange={(e) => handleRenameNotebook(ix, e)}/>
                            :
                            <input type="text" className="tabText"
                                style={{
                                    border: 0,
                                    borderBottom: 0
                                }}
                                value={name}
                                onChange={(e) => handleRenameNotebook(ix, e)} />
                    }
                </div>
                <FontAwesomeIcon icon={faClose} onClick={() => handleCloseNotebook(ix)} />
            </Nav.Link>
        }
        )}
    </Nav>
}