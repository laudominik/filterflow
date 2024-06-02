import {AnyT, jsonMapMember, jsonMember, jsonObject} from "typedjson";
import {IEngine, GUID} from "./iengine"
import {NodeResponse, NodeResponseError, NodeResponseUpdated} from "./nodeResponse"


export function connect<T extends node<T>>(source: T, source_nr: number, destination: T, destination_nr: number): boolean {
    if (source.meta.output_size <= source_nr || destination.meta.input_size <= destination_nr) return false;

    const src_output = source.connected_to_outputs.get(source_nr) || [];
    const dst_input = destination.inputs.get(destination_nr);

    if (dst_input !== undefined) {
        console.log("Input claimed")
        return false;
    }

    // connect 
    src_output.push([destination.meta.id, destination_nr]);
    source.connected_to_outputs.set(source_nr, src_output);

    destination.inputs.set(destination_nr, [source.meta.id, source_nr]);

    // inform engine
    source.engine.dispatchEvent(new CustomEvent("connection_added", {detail: [[source.meta.id, source_nr], [destination.meta.id, destination_nr]]}))
    destination.engine.requestUpdate(destination.meta.id);
    return true;
}

export function disconnect<T extends node<T>>(source: T, source_nr: number, destination: T, destination_nr: number) {
    if (source.meta.output_size <= source_nr || destination.meta.input_size <= destination_nr) return false;
    const src_output = source.connected_to_outputs.get(source_nr) || [];
    const dst_input = destination.inputs.get(destination_nr);
    if (dst_input === undefined) {
        console.log("Input empty")
        return false;
    }
    // disconnect 
    console.log("meta id: ", destination.meta.id)
    console.log(src_output)
    const new_output = src_output.filter(v => !(v[0] == destination.meta.id && v[1] == destination_nr));
    console.log(new_output)

    if (new_output.length === src_output.length) {
        console.log("Output empty")
        return false;
    }
    source.connected_to_outputs.set(source_nr, new_output);

    destination.inputs.delete(destination_nr);

    // inform engine
    source.engine.dispatchEvent(new CustomEvent("connection_removed", {detail: [[source.meta.id, source_nr], [destination.meta.id, destination_nr]]}))
    destination.engine.requestUpdate(destination.meta.id);
    return true;
}


export type NodeInit<T extends node<T>> = {
    id: string, inputs: number, outputs: number, engine?: IEngine<T>
}

export type IOType = "input"|"output";

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
    public inputs: Map<number, [GUID, number]>
    @jsonMapMember(Number, AnyT)
    public connected_to_outputs: Map<number, [GUID, number][]> // two way linked list

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

    public onDelete() {

    }

    public disconnect() {
        this.inputs.forEach(([parent, parent_nr], key) => {
            // TODO: here it sometimes crashes (no parent, this.inputs most likely not updated), find why's that, for now adding check
            const parentNode = this.engine.getNode(parent)
            if (!parentNode) {
                console.log("[WARNING] missing parent in node.ts::remove()")
                console.trace()
                console.log(this.engine)
                return;
            }
            disconnect(parentNode, parent_nr, this.engine.getNode(this.meta.id)!, key);
        })
        this.connected_to_outputs.forEach((childrens, key) => {
            childrens.forEach(([child, child_nr]) => {
                disconnect(this.engine.getNode(this.meta.id)!, key, this.engine.getNode(child)!, child_nr);
            })
        })
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
        if (this.could_update()) {
            if (await this._update_node()) {
                this.dispatch_updated_successfully();
            } else {
                this.dispatch_updated_error("Transforming error");
            }
        } else {
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
        if (!this.could_update()) {
            if (this.dependency.inputs == 1) {
                this.dispatch_updated_error("Not all inputs connected");
                return true;
            } else {
                return false;
            }
        }
        if (this.dependency.inputs === this.inputs.size) {
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
        this.engine.internal.dispatchEvent(new CustomEvent<NodeResponse>("info", {detail: msg}))
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
        console.log(this.engine)
        // debugger
        this.engine.internal.dispatchEvent(new CustomEvent<NodeResponse>("info", {detail: msg}))
    }

    public String(): String{
        let inputs = ""
        this.inputs.forEach(v => inputs+= `${v[0]} ${v[1]}`)
        
        let outputs = ""
        this.connected_to_outputs.forEach(v => v.forEach(p => outputs+= `${v[0]}->${p[0]} ${p[1]}`))
        return`
        ${this.meta.id}
        Connections:
            Inputs: ${inputs}
            Outputs: ${outputs}
        `
    }
}