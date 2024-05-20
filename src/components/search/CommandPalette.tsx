import Fuse, {FuseResult, RangeTuple} from 'fuse.js'
import {useEffect, useMemo, useRef, useState, useSyncExternalStore} from "react";
import {Modal} from "react-bootstrap";
import {commandRegistry, useCommand} from "../../util/commands";
import './CommandPalette.css'
import './CommonSearchStyle.css'
import {highlightMatches} from '../graph_view/SearchPopup';
import {KeyboardEventKey} from '../../util/keys';

export function CommandPalette({show, setShow}: {show: boolean, setShow: (_: React.SetStateAction<boolean>) => void}) {
    const handleClose = () => {setShow(false)}
    const handleSearch = (e: React.ChangeEvent) => {
        const value = (e.target as HTMLInputElement).value;
        setQuery(value);
        setSelected(0);
    }

    const commands = useSyncExternalStore(commandRegistry.subscribeCommands.bind(commandRegistry), commandRegistry.getCommands.bind(commandRegistry))
    const fuse = useMemo(() => new Fuse(commands, {includeMatches: true, keys: ['name'], ignoreLocation: true, minMatchCharLength: 1}), [commands])

    const toggleVisibility = () => {setShow(v => !v)}
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState<string>("");
    const [selected, setSelected] = useState(0);
    const [mouseSelected, setMouseSelected] = useState(0);
    const commandPaletteList = useRef<HTMLDivElement>(null);

    useEffect(() => {
        commandPaletteList.current?.querySelector('.selected')?.scrollIntoView({
            behavior: 'auto',
            block: 'center'
        })
    }, [selected])

    const queryResultData = fuse.search(query);
    const totalResults = query === "" ? commands.length : queryResultData.filter(v => v.matches != null).length;


    const defaultResult = <>{commands.map((v, i) =>
        <div className={'commandDiv' + (selected === i ? ' selected' : '') + (mouseSelected === i ? ' mouseSelected' : '')} key={v.name} onMouseOver={() => {setMouseSelected(i)}} onClick={() => {v.callback.current(); handleClose()}}>
            <div className='commandLabel'>{v.name}</div>
            <div className='commandBindings'>{
                v.binding?.map((key, i, a) => <>
                    <span className='commandBindingKey'>{key}</span>
                    {i < a.length - 1 ? <span className='commandBindingPlus'>+</span> : <></>}
                </>)
            }</div>
        </div>
    )}</>

    const searchResult = <>{queryResultData.filter(v => v.matches != null).map((v, i) => {
        const matches = new Map(v.matches!.map(value => [value.key, value]));
        const fullMatch = matches.has('name') ? matches.get('name')?.indices : [];
        return <div className={'commandDiv' + (selected === i ? ' selected' : '') + (mouseSelected === i ? ' mouseSelected' : '')} key={v.item.name} onMouseOver={() => {setMouseSelected(i)}} onClick={() => {v.item.callback.current(); handleClose()}}>
            <div>{highlightMatches(v.item.name, fullMatch)}</div>
            <div className='commandBindings'>{
                v.item.binding?.map((key, i, a) => <>
                    <span className='commandBindingKey'>{key}</span>
                    {i < a.length - 1 ? <span className='commandBindingPlus'>+</span> : <></>}
                </>)
            }</div>
        </div>
    })}</>


    const handleControlls = (e: React.KeyboardEvent) => {
        if (e.key as KeyboardEventKey === "ArrowUp") {
            setSelected(selected - 1 < 0 ? totalResults - 1 : selected - 1)
            e.preventDefault();
            e.stopPropagation();

            return;
        }
        if (e.key as KeyboardEventKey === "ArrowDown") {
            setSelected(selected + 1 >= totalResults ? 0 : selected + 1)
            e.preventDefault();
            e.stopPropagation();
            commandPaletteList.current?.querySelector('.selected')?.scrollIntoView({
                behavior: 'auto',
                block: 'center'
            })
        }
        if (e.key as KeyboardEventKey === "Enter") {
            if (query === "") {
                commands[selected].callback.current();
            } else {
                queryResultData.filter(v => v.matches != null)[selected].item.callback.current();
            }
            handleClose();
            e.preventDefault();
            e.stopPropagation();
        }
        // TODO: remove this hardcoded shortcut
        if (e.key === 'p' && e.ctrlKey === true && e.shiftKey === false && e.altKey === false) {
            e.preventDefault();
            handleClose();
        }
    }


    // TODO: move to wrapper
    useCommand({
        callback: toggleVisibility,
        name: "Show command pallete",
        binding: ["Control", "p"],
    })

    useEffect(() => {
        if (show === true && inputRef.current != null) {
            inputRef.current.focus();
            inputRef.current.select();
            setQuery("")
            setSelected(0)
        }
    }, [show])

    return <Modal className='commandPaletteModal' show={show} onHide={handleClose} animation={false}>
        <Modal.Header>
            <input ref={inputRef}
                onKeyDown={handleControlls}
                onChange={handleSearch} placeholder="search any command"
            />
        </Modal.Header>
        <Modal.Body>
            <div className="commandPaletteList" id='command_list' role='listbox' ref={commandPaletteList}>
                {
                    query === "" ? defaultResult : searchResult
                }
            </div>
        </Modal.Body>
    </Modal>
}