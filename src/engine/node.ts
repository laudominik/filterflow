import { IEngine, GUID } from "./iengine"
import { NodeResponse, NodeResponseError, NodeResponseUpdated } from "./nodeResponse"


export function connect<T extends node<T>>(source: T, source_nr: number, destination: T, destination_nr: number): boolean {
    if (destination.inputs.has(destination_nr)){
        return false;
    }
    source.connect_output(source_nr, destination, destination_nr)
    destination.connect_input(destination_nr, source, source_nr)
    return true;
}

export function disconnect<T extends node<T>>(source: T, source_nr: number, destination: T, destination_nr: number) {
    if (!destination.inputs.has(destination_nr)){
        return false;
    }
    source.disconnect_output(source_nr, destination, destination_nr)
    destination.disconnect_input(destination_nr, source, source_nr)
    return true;
}


export type NodeInit<T extends node<T>> = {
    id: string, inputs: number, outputs: number, engine?: IEngine<T>
}


export abstract class node<T extends node<T>>{
    meta: {
        id: string,
        input_size: number,
        output_size: number,
    }
    dependency: {
        inputs: number,
        tick: number
    }
    engine: IEngine<T>
    // TODO change to GUID
    inputs: Map<number, [GUID, number]>
    connected_to_outputs: Map<number, [GUID, number][]> // two way linked list

    constructor(params: NodeInit<T>) {
        this.engine = params.engine!
        this.inputs = new Map<number, [GUID, number]>()
        this.connected_to_outputs = new Map<number, [GUID, number][]>()
        this.meta = {
            id: params.id,
            input_size: params.inputs,
            output_size: params.outputs
        }
        this.dependency = {
            inputs: 0,
            tick: 0,
        }
    }

    public connect_output(output_nr: number, self: T, self_input_nr: number) {
        if (this.connected_to_outputs.has(output_nr)) {
            this.connected_to_outputs.set(output_nr, [[self.meta.id, self_input_nr]])
        } else {
            const prev = this.connected_to_outputs.get(output_nr) ?? [];
            this.connected_to_outputs.set(output_nr, [...prev, [self.meta.id, self_input_nr]])
        }
    }

    public disconnect_output(output_nr: number, self: T, self_input_nr: number) {
        if (this.connected_to_outputs.has(output_nr)) {
            let prev = this.connected_to_outputs.get(output_nr) ?? [];
            let searched_id = prev.findIndex(([child, child_nr]) => child == self.meta.id && child_nr == self_input_nr)
            if (searched_id != -1) {
                delete prev[searched_id];
            } else {
                console.log("Logic error disconnect output without connecting first")
                return;
            }
            this.connected_to_outputs.set(output_nr, prev)
        } else {
            console.log("Logic error disconnect output without connecting first")
        }
    }


    public connect_input(input_nr: number, parent: T, parent_output_nr: number) {
        if (this.inputs.has(input_nr)) {
            console.log("Logic error reconnecting input without disconnecting first")
            this.inputs.set(input_nr, [parent.meta.id, parent_output_nr])
        } else {
            this.inputs.set(input_nr, [parent.meta.id, parent_output_nr])
        }
    }

    public disconnect_input(input_nr: number, parent: T, parent_output_nr: number) {
        if (this.inputs.has(input_nr)) {
            this.inputs.delete(input_nr)
        } else {
            console.log("Logic error disconnecting input without connecting first")
        }
    }

    public remove() {
        this.inputs.forEach(([parent, parent_nr], key) => {
            // TODO: here it sometimes crashes (no parent, this.inputs most likely not updated), find why's that, for now adding check
            const parentNode = this.engine.getNode(parent)
            if(!parentNode){
                console.log("[WARNING] missing parent in node.ts::remove()")
                console.trace()
                console.log(this.engine)
                return;
            }

            parentNode.disconnect_output(parent_nr, this as any, key)
            this.engine.dispatchEvent(new CustomEvent("connection_remove",{detail:[[parent,parent_nr],[this.meta.id,key]]}))
        })
        this.connected_to_outputs.forEach((childrens, key) => {
            childrens.forEach(([child, child_nr]) => {
                this.engine.getNode(child)!.disconnect_input(child_nr, this as any, key)
                this.engine.dispatchEvent(new CustomEvent("connection_remove",{detail:[[this.meta.id,key],[child,child_nr]]}))
            })
        })

        this.inputs.clear();
        this.connected_to_outputs.clear();
    }

    // CRUD
    // CREATE (done by external entity)
    // Connect
    // disconnect (disconnect one of input/outputs)
    // remove (only disconnect and send msg about remove)
    // update (on child element)
    
    /**
     * Update internal state
     * This must return immediately make it async or dispatch function(type annotation prohibit use of async and abstract) 
     */
    public abstract _update_node(): void;

    /**
     * Update node handle checking connection perquisites
     * Return is if update by connection has started
     */
    public update_node(tick: number): boolean {
        if (this.dependency.tick != tick) {
            this.dependency.tick = tick;
            this.dependency.inputs = 1;
        } else {
            this.dependency.inputs += 1;
        }
        if (this.inputs.size < this.meta.input_size){
            // TODO make in into internal check in _update_node
            // some inputs can be optional
            this.dispatch_error("Not all inputs connected");
            return true;
        }
        if (this.dependency.inputs >= this.inputs.size) { // using this in case some input are optional(if all are needed handle it by returning error to engine)
            this._update_node();
            return true;
        }
        return false;
    }

    public dispatch_update() {
        let updates: GUID[] = []

        this.connected_to_outputs.forEach((childrens, _) => {
            updates.push(...childrens.map(([child]) => child))
        })

        const msg: NodeResponseUpdated = {
            nodeId: this.meta.id,
            requestUpdates: updates,
            status: "updated"
        }

        this.engine.internal.dispatchEvent(new CustomEvent<NodeResponse>("info", { detail: msg }))
    }

    public dispatch_error(err: string) {
        let updates: GUID[] = []

        this.connected_to_outputs.forEach((childrens, _) => {
            updates.push(...childrens.map(([child]) => child))
        })

        const msg: NodeResponseError = {
            nodeId: this.meta.id,
            invalidateChildrens: updates,
            status: "error",
            error: err,
        }

        this.engine.internal.dispatchEvent(new CustomEvent<NodeResponse>("info", { detail: msg }))
    }
}