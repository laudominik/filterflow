import { AnyT, jsonMapMember, jsonMember, jsonObject } from "typedjson";
import { IEngine, GUID } from "./iengine"
import { NodeResponse, NodeResponseError, NodeResponseUpdated } from "./nodeResponse"


export function connect<T extends node<T>>(source: T, source_nr: number, destination: T, destination_nr: number): boolean {
    if (destination.inputs.has(destination_nr)){
        return false;
    }
    source._connect_output(source_nr, destination, destination_nr)
    destination._connect_input(destination_nr, source, source_nr)
    source.engine.dispatchEvent(new CustomEvent("connection_added",{detail:[[source.meta.id,source_nr],[destination.meta.id,destination_nr]]}))

    destination.engine.requestUpdate(destination.meta.id);
    return true;
}

export function disconnect<T extends node<T>>(source: T, source_nr: number, destination: T, destination_nr: number) {
    if (!destination.inputs.has(destination_nr)){
        return false;
    }
    destination._disconnect_input(destination_nr, source, source_nr)
    source._disconnect_output(source_nr, destination, destination_nr)
    source.engine.dispatchEvent(new CustomEvent("connection_remove",{detail:[[source.meta.id,source_nr],[destination.meta.id,destination_nr]]}))
    destination.engine.requestUpdate(destination.meta.id);
    return true;
}


export type NodeInit<T extends node<T>> = {
    id: string, inputs: number, outputs: number, engine?: IEngine<T>
}

@jsonObject
export abstract class node<T extends node<T>>{
    valid: boolean = false; // not included in json to reset state
    @jsonMember(AnyT)
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
    @jsonMapMember(Number, AnyT)
    inputs: Map<number, [GUID, number]>
    @jsonMapMember(Number, AnyT)
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

    public _connect_output(output_nr: number, self: T, self_input_nr: number) {
        if (!this.connected_to_outputs.has(output_nr)) {
            this.connected_to_outputs.set(output_nr, [[self.meta.id, self_input_nr]])
        } else {
            const prev = this.connected_to_outputs.get(output_nr) ?? [];
            this.connected_to_outputs.set(output_nr, [...prev, [self.meta.id, self_input_nr]])
        }
    }

    public _disconnect_output(output_nr: number, self: T, self_input_nr: number) {
        if (this.connected_to_outputs.has(output_nr)) {
            let prev = this.connected_to_outputs.get(output_nr) || [];
            let new_prev = prev.filter(([child, child_nr]) => child == self.meta.id && child_nr == self_input_nr)
            this.connected_to_outputs.set(output_nr,new_prev);
            if (prev.length == new_prev.length) {
                console.log("Logic error disconnect output without connecting first")
                return;
            }
        } else {
            console.log("Logic error disconnect output without connecting first")
        }
    }


    public _connect_input(input_nr: number, parent: T, parent_output_nr: number) {
        if (this.inputs.has(input_nr)) {
            console.log("Logic error reconnecting input without disconnecting first")
            this.inputs.set(input_nr, [parent.meta.id, parent_output_nr])
        } else {
            this.inputs.set(input_nr, [parent.meta.id, parent_output_nr])
        }
    }

    public _disconnect_input(input_nr: number, parent: T, parent_output_nr: number) {
        if (this.inputs.has(input_nr)) {
            this.inputs.delete(input_nr)
        } else {
            console.log("Logic error disconnecting input without connecting first")
        }
    }

    public disconnect() {
        this.inputs.forEach(([parent, parent_nr], key) => {
            // TODO: here it sometimes crashes (no parent, this.inputs most likely not updated), find why's that, for now adding check
            const parentNode = this.engine.getNode(parent)
            if(!parentNode){
                console.log("[WARNING] missing parent in node.ts::remove()")
                console.trace()
                console.log(this.engine)
                return;
            }
            disconnect(parentNode,parent_nr,this.engine.getNode(this.meta.id)!,key);
        })
        this.connected_to_outputs.forEach((childrens, key) => {
            childrens.forEach(([child, child_nr]) => {
                disconnect(this.engine.getNode(this.meta.id)!,key,this.engine.getNode(child)!,child_nr);
            })
        })
        this.inputs.clear(); // all inputs are now unnconnected
        this.connected_to_outputs.clear(); // remove later to
        this.engine.requestUpdate(this.meta.id); // self invalidate
    }

    // CRUD
    // CREATE (done by external entity)
    // Connect
    // disconnect (disconnect one of input/outputs)
    // remove (only disconnect and send msg about remove)
    // update (on child element)
    
    /**
     * This function should update internal state (canvas, meta,...) and return true if update resulted in stable and proper state 
     * if return false node will be invalidated 
    */
    public abstract _update_node(): Promise<boolean>;
    
    /**
     * return true if all required connections are present
     */
    public could_update(): boolean {
        return this.inputs.size >= this.meta.input_size
    }
    /**
     * Call update prequisities will be check
     * call _update and depending on return return type dispatch updated succesfully or error
     */
    public async update_node(): Promise<void> {
        if(this.could_update()){
            if (await this._update_node()){
                this.dispatch_updated_successfully();
            }else{
                this.dispatch_updated_error("Transforming error");
            }
        }else{
            this.dispatch_updated_error("Not all required connections connected");
        }
    }
    /**
     * Update node handle checking connection perquisites
     * Return is if update by connection has started
     * Should only by called by engine
     */
    public dispatch_update(tick: number): boolean {
        if (this.dependency.tick != tick) {
            this.dependency.tick = tick;
            this.dependency.inputs = 1;
        } else {
            this.dependency.inputs += 1;
        }
        if (!this.could_update()){
            this.dispatch_updated_error("Not all inputs connected");
            return true;
        }
        if (this.dependency.inputs >= this.inputs.size) { 
            // using this in case some input are optional(if all are needed handle it by returning error to engine)
            this.update_node();
            return true;
        }
        return false;
    }

    private dispatch_updated_successfully() {
        this.valid = true;
        let updates: GUID[] = []

        this.connected_to_outputs.forEach((childrens, _) => {
            updates.push(...childrens.map(([child]) => child))
        })

        const msg: NodeResponseUpdated = {
            nodeId: this.meta.id,
            requestUpdates: updates,
            status: "updated"
        }

        console.log(`UPDATE: success for ${this.meta.id}`)
        this.engine.internal.dispatchEvent(new CustomEvent<NodeResponse>("info", { detail: msg }))
    }

    public dispatch_updated_error(err: string) {
        this.valid = false;
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

        console.log(`UPDATE: error for ${this.meta.id}`)
        this.engine.internal.dispatchEvent(new CustomEvent<NodeResponse>("info", { detail: msg }))
    }
}