import 'reflect-metadata'
import { jsonMapMember, jsonObject } from "typedjson";
import Transform from "./Transform";
import mapToTransform, {knownTypes} from "./TransformDeclarations";
import { connect, disconnect } from './node';
import { NodeResponse } from './nodeResponse';

export type GUID = string;

// FLOW
// node get updatedParams
// node request to update self

// node was requested to update
// node get updated
// node notify engine that is was updated and send what next should be updated

// loop
// engine decide that its time to notify parent that internal state changed 


// Engine send events to parent element (logic decupling)
@jsonObject({knownTypes: Array.from(knownTypes())})
export class Engine extends EventTarget{
    // internal is comunication from graph components to graph components, with information collection by engine
    // this enable better batching of updates
    internal: EventTarget // i'm not sure if this is sequence stable for now batches
    // engine should call node in async
    // this is only for async return (ensure that some msg is always send, otherwise batching in this implementation will break) 
    
    batchState: {
       response: ExternalEngineResponse
       pendingUpdates: Set<GUID> // basicly open updates, that wait for return
       doneUpdates: Set<GUID>,
       tick: number
    }


    @jsonMapMember(String, Transform)
    nodes: Map<GUID,Transform>

    source_nodes: GUID[]

    constructor(){
        super()
        this.internal = new EventTarget();
        this.batchState = {
            tick:1,
            response: new ExternalEngineResponse(),
            pendingUpdates: new Set(),
            doneUpdates: new Set(),
        }
        this.nodes = new Map()
        this.source_nodes = []
        this.internal.addEventListener("info",this.handleInternalInfo as any)
    }

    public async updateNodeParams(node:GUID,params:any){
        const transform = this.nodes.get(node)
        if (transform === undefined){
            // TODO think about some error handling
            return
        }
        // if found add to pending
        this.batchState.pendingUpdates.add(node)
        transform.updateParams(params);

    }

    public addNode(transformation: string, params: any): GUID{
        const node = mapToTransform(transformation)!
        const guid = node.meta.id;
        if (node.meta.input_size == 0){
            this.source_nodes.push(guid)
        }
        node.engine = this;
        this.nodes.set(guid,node) 
        return guid
    }

    public removeNode(guid:GUID){
        let node = this.getNode(guid);
        node?.remove();
        this.nodes.delete(guid);
        this.source_nodes = this.source_nodes.filter((v) => v!= guid);
    }

    public connectNodes(source:GUID,destination:GUID,source_handle: number,destination_handle:number): boolean{
        connect(this.nodes.get(source)!,source_handle,this.nodes.get(destination)!,destination_handle)
        return true
    }

    public disconnectNodes(source:GUID,destination:GUID,source_handle: number,destination_handle:number): boolean{
        disconnect(this.nodes.get(source)!,source_handle,this.nodes.get(destination)!,destination_handle)
        return true
    }

    public getNode(node:GUID): Transform | undefined {
        return this.nodes.get(node)
    }

    public update_all(){
        const tick = this.batchState.tick + 1;
        this.batchState = {
            doneUpdates: new Set(),
            pendingUpdates: new Set(this.source_nodes),
            response: new ExternalEngineResponse(),
            tick: tick,
        }

        this.source_nodes.forEach((id) =>{
            this.getNode(id)?.update_node(tick);
        })
    }

    private handleInternalInfo(event: CustomEvent<NodeResponse>) {
        
        if (event.detail.status == "updated"){
            const msg = event.detail;
            this.batchState.doneUpdates.add(msg.nodeId);
            msg.requestUpdates.forEach((id) =>{
                this.batchState.pendingUpdates.add(id);
                this.getNode(id)?.update_node(this.batchState.tick);
            })
            this.batchState.response.updated.push(msg.nodeId);
        }else if (event.detail.status == "error"){
            const msg = event.detail;
            this.batchState.doneUpdates.add(msg.nodeId);
            msg.invalidateChildrens.forEach((id) =>{
                this.batchState.pendingUpdates.add(id);
                this.getNode(id)?.update_node(this.batchState.tick);
            })
            this.batchState.response.errors.push(msg.nodeId);

        }
        
        if (this.batchState.pendingUpdates.size == this.batchState.doneUpdates.size){
            this.dispatchEvent(new CustomEvent<ExternalEngineResponse>("update",{detail:this.batchState.response}))
        }
    }
}

// this will be send to parent element to inform that some element changed
class ExternalEngineResponse{
    updated: GUID[] // all nodes that finished update successfully
    errors: GUID[]   // all nodes that returned error
    constructor(){
        this.updated = []
        this.errors = []
    }
}

// INFO Simple shop should handle add node, auto connect if between and have information about sequence
// this handle only updating node state and batching, and connecting (think about validating connection)
// node/transformation handles whole update logic