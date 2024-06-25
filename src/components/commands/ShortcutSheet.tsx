import {useContext, useState, useSyncExternalStore} from "react";
import {Button, Modal} from "react-bootstrap";
import {CommandContext, commandRegistry, useCommand} from "../../util/commands";
import "./ShortcutSheet.css"


export default function ShortcutSheet({show, setShow}: {show: boolean, setShow: (_: boolean) => void}) {
    const handleClose = () => setShow(false);
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
                <tbody>

                {commands.filter(v => v.hidden !== true).map(v => {
                    return <tr key={v.name}>
                        <td className="KeyBindings">
                            {
                                v.binding?.map(v => <kbd key={v}>{v}</kbd>)
                            }
                        </td>
                        <td></td>
                        <td>{v.name}</td>
                    </tr>
                })}
                </tbody>
            </table>
        </Modal.Body>
    </Modal>
}