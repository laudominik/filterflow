import { DependencyList, MutableRefObject, createContext, useCallback, useEffect, useRef } from "react";
import { KeyboardEventKey } from "./keys";

type KeyBinding = KeyboardEventKey[];
type CommandHandler = MutableRefObject<CallableFunction>;
type HotKeyNode = {
    children: Map<string, HotKeyNode>
    callback?: CommandHandler[]
}

interface ICommand{
    name: string
    description?: string
    binding?: KeyBinding
    callback : CommandHandler
    hidden?: boolean,
    guid: string
}

// based on https://n1ghtmare.github.io/2022-01-14/implement-a-keyboard-shortcuts-handler-in-typescript/
class CommandRegistry {
    private commands: Map<string, ICommand> = new Map();
    private commandsList : ICommand[] = [];
    private commandsListeners: CallableFunction[] = [];
    private bindingsTree: HotKeyNode = {children: new Map()};
    private buffer : KeyboardEventKey[] = [];

    keydownListener(e : KeyboardEvent) {
        if(e.repeat) return;
        if(e.target instanceof HTMLInputElement) return;
        
        this.buffer = [...this.buffer, e.key]
        const res = this.findMatch(this.buffer);

        if(res){
            e.preventDefault();
            e.stopPropagation();
            res.forEach(callback => callback());
        }
    }

    keyupListener(e : KeyboardEvent){
        // remove key from buffer
        this.buffer = this.buffer.filter(v => v !== e.key)

        // https://stackoverflow.com/questions/11818637/why-does-javascript-drop-keyup-events-when-the-metakey-is-pressed-on-mac-browser
        if(e.key === 'meta'){
            this.clearBuffer();
        }


    }

    /**Use **wisely** to resolve weird situations like `Alt`+`Tab` is pressed\
     *      and the `Alt` stays in buffer due lost focus to window */
    clearBuffer(){
        this.buffer = []
    }

    private bind(command: ICommand){
        if (!command.binding) return;

        let currentNode : HotKeyNode | undefined = this.bindingsTree;
        [...command.binding].sort().forEach(key => {
            if(!currentNode?.children?.get(key)){
                const node : HotKeyNode = {children: new Map()}
                currentNode?.children.set(key, node);
            }
            currentNode = currentNode?.children.get(key);
        });

        if(!currentNode.callback) currentNode.callback = [];
        currentNode.callback = [...currentNode.callback, command.callback];
    }

    private unbind(command : ICommand){
        if(!command.binding) return;
        let currentNode = this.bindingsTree;
        const chain: HotKeyNode[] = [];
        for (const key of [...command.binding].sort()){
            const {children} = currentNode;
            if(!children) return;

            const childNode = children.get(key);
            if(!childNode) return;
            
            chain.push(currentNode);
            currentNode = childNode;
        }

        if(chain.length === 0) return;

        // TODO: handle removing nodes from tree
        currentNode.callback = currentNode.callback?.filter(v => v !== command.callback);
        if(currentNode.callback?.length === 0) currentNode.callback = undefined;
    }

    findMatch(buffer: KeyBinding) : CallableFunction[] | undefined {
        const sorted = buffer.sort();
        let currentNode : HotKeyNode | undefined = this.bindingsTree;
        sorted.forEach(key => {
            currentNode = currentNode?.children.get(key)
        });

        return currentNode?.callback?.map(c => c.current);
    }
    
    register(command : ICommand){
        const uuid = crypto.randomUUID();
        command.guid = uuid;
        this.commands.set(uuid, command);
        this.commandsList = [...this.commandsList, command];
        this.bind(command);
        return uuid;
    }

    unregister(uuid : string){
        const command = this.commands.get(uuid);
        if(!command) return;

        this.unbind(command)
        this.commandsList = this.commandsList.filter(v => v != this.commands.get(uuid))
        this.commands.delete(uuid);
    }

    getCommands() : Array<ICommand> {
        return this.commandsList;
    }

    subscribeCommands(listener: CallableFunction) {
        this.commandsListeners = [...this.commandsListeners, listener];
        return () => {
            this.commandsListeners = this.commandsListeners.filter(l => l != listener);
        }
    } 

    emmitChangeCommands(){
        this.commandsListeners.forEach(v => v());
    }
}

/**
 * this is the hook that you should use to register a new command\
 * registers command, and binds its action to keyboard shortcut (if key binding was given)\
 *      it register command when component is created, and removes command when component unloads\
 *      between renders it updates function handler if passed `callback` function has changed\
 * \
 * the order of keys in `binding` does not matter\
 * the `name` don't have to be unique
 * 
 * @example
 * //use useCallback, for functions in compontents that re-renders too often
const handleNodeTrashIcon = ()=>{
    previewContext.removePreviewStore(highlightedGUID)
    setOpenedPreviewsState(crypto.randomUUID())
    nodeContext.removeTransform(highlightedGUID)
    setHighlightedGUID("")
}

// register command
useCommand({
    name: "Delete Node",
    binding: ["Shift","Delete"], // (Shift+Delete) use literals from autocomplete
    action: handleNodeTrashIcon,
    dependencies: [highlightedGUID]
})
 */
export function useCommand(command: {name: string, description?: string, hidden?: boolean, binding?: KeyBinding, callback: CallableFunction, dependencies?: DependencyList}) {
    // based on https://github.com/JohannesKlauss/react-hotkeys-hook/blob/main/src/useHotkeys.ts
    const deps = command.dependencies;
    const memoizedCallback = useCallback(command.callback, deps ?? [])
    const callbackRef = useRef<CallableFunction>(memoizedCallback)
    
    if(deps){
        callbackRef.current = memoizedCallback;
    } else{
        callbackRef.current = command.callback;
    }
    
    useEffect(() => {
        const cmd : ICommand = {binding: command.binding, name: command.name, callback: callbackRef, hidden: command.hidden, description: command.description, guid: ""} //guid is automaticly filled by `register`
        const uuid = commandRegistry.register(cmd)
        return () => {commandRegistry.unregister(uuid);}
    }, []);
  }

// TODO: check if batching is possible, and try to remove useEffect

/**You need to dispatch this hook somewhere (but only once) to enable keyboard shortcuts */
export function useKeybinds(){
    useEffect(()=>{
        const keydown = commandRegistry.keydownListener.bind(commandRegistry);
        const keyup = commandRegistry.keyupListener.bind(commandRegistry);
        const clearBuff = commandRegistry.clearBuffer.bind(commandRegistry);
        document.addEventListener("keydown", keydown);
        document.addEventListener("keyup", keyup);
        window.addEventListener('blur', clearBuff);
        return () => {
            document.removeEventListener("keydown", keydown);
            document.removeEventListener("keyup", keyup);
            window.removeEventListener('blur', clearBuff);
        }
    }, [])
}

// WIP: do not use those yet
export const commandRegistry = new CommandRegistry();
export const CommandContext = createContext(commandRegistry);

