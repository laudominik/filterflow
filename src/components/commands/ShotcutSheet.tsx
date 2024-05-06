import {useContext, useState, useSyncExternalStore} from "react";
import {Button, Modal} from "react-bootstrap";
import {CommandContext, commandRegistry, useCommand} from "../../util/commands";
import "./ShortcutSheet.css"


export default function ShortcutSheet({show, setShow}: {show: boolean, setShow: (_: boolean) => void}) {
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    const toggle = () => setShow(!show);

    useCommand({
        name: "Show Shortcuts",
        description: "Toggles this window",
        callback: toggle,
        binding: ["Shift", "?"]
    })

    const commandRegistry = useContext(CommandContext);
    const commands = useSyncExternalStore(commandRegistry.subscribeCommands.bind(commandRegistry), commandRegistry.getCommands.bind(commandRegistry))

    // TODO: add human readable form
    return <Modal show={show} centered onHide={handleClose} animation={false}>
        <Modal.Header closeButton>
            <Modal.Title>Keyboard Shortcuts</Modal.Title>

        </Modal.Header>

        <Modal.Body>
            <table>
                {Array.from(commands.values()).map(v => {
                    return <tr>
                        <td className="KeyBindings"><span className="SheetDialogKey">{v.binding?.sort().filter(v => v !== "Shift")}</span></td>
                        <td></td>
                        <td>{v.name}</td>
                    </tr>
                })}
            </table>
        </Modal.Body>
    </Modal>
}