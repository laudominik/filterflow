import { jsonMapMember, jsonObject } from "typedjson";
import Transform, { KVParams } from "./Transform";
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
        this.internal.addEventListener("info",this.handleInternalInfo.bind(this) as any)
        this.internal.addEventListener("connection_remove",this.handleInternalConnectionsRemove.bind(this) as any)
    }

    public updateNodeParams(node:GUID,params:KVParams): void{
        const transform = this.nodes.get(node)
        if (transform === undefined){
            // TODO think about some error handling
            return
        }
        // if found add to pending
        this.batchState.pendingUpdates.add(node)
        transform.updateParams(params);
        transform._update_node();
    }

    public addNode(transformation: string, params: any): GUID{
        const node = mapToTransform(transformation)!
        if(params.position){
            node.setPos(params.position);
        }
        if(params.previewPosition){
            node.setPreviewPos(params.previewPosition);
        }
        const guid = node.meta.id;
        if (node.meta.input_size == 0){
            this.source_nodes.push(guid)
        }
        node.engine = this;
        this.nodes.set(guid,node)
        this.batchState.response.node.added.push(guid); 
        return guid
    }

    public removeNode(guid:GUID){
        let node = this.getNode(guid);
        node?.remove();
        this.nodes.delete(guid);
        this.batchState.response.node.removed.push(guid);
        this.source_nodes = this.source_nodes.filter((v) => v!= guid);
    }

    public connectNodes(source:GUID,destination:GUID,source_handle: number,destination_handle:number): boolean{
        let ok = connect(this.nodes.get(source)!,source_handle,this.nodes.get(destination)!,destination_handle)
        if (ok){
            this.batchState.response.connection.added.push([[source,source_handle],[destination,destination_handle]]);
        }
        return ok;
    }

    public disconnectNodes(source:GUID,destination:GUID,source_handle: number,destination_handle:number): boolean{
        let ok = disconnect(this.nodes.get(source)!,source_handle,this.nodes.get(destination)!,destination_handle)
        if (ok){
            this.batchState.response.connection.removed.push([[source,source_handle],[destination,destination_handle]]);
        }
        return ok;
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
            msg.requestUpdates.forEach((id) =>{
                this.batchState.pendingUpdates.add(id);
                this.getNode(id)?.update_node(this.batchState.tick);
            })
            this.batchState.response.node.updated.push(msg.nodeId);
            this.batchState.doneUpdates.add(msg.nodeId);
        }else if (event.detail.status == "error"){
            const msg = event.detail;
            msg.invalidateChildrens.forEach((id) =>{
                this.batchState.pendingUpdates.add(id);
                this.getNode(id)?.update_node(this.batchState.tick);
            })
            this.batchState.response.node.errors.push(msg.nodeId);
            this.batchState.doneUpdates.add(msg.nodeId);
        }
        
        if (this.batchState.pendingUpdates.size == this.batchState.doneUpdates.size){
            this.dispatchEvent(new CustomEvent<ExternalEngineResponse>("update",{detail:this.batchState.response}))
        }
    }
    
    private handleInternalConnectionsRemove(event: CustomEvent<[[GUID,number],[GUID,number]]>){
        this.batchState.response.connection.removed.push(event.detail);
        // kick node to recalculate state update in child node
        this.batchState.pendingUpdates.add(event.detail[1][0]);
        this.getNode(event.detail[1][0])?.update_node(this.batchState.tick);
        // dispatch will trigger when all child nodes will update ~1s
        // this.dispatchEvent(new CustomEvent<ExternalEngineResponse>("update",{detail:this.batchState.response}))
    }
}

// this will be send to parent element to inform that some element changed
export class ExternalEngineResponse{
    node :{
        updated: GUID[] // all nodes that finished update successfully
        errors: GUID[]   // all nodes that returned error
        added: GUID[]
        removed: GUID[]
    }

    connection : {
        added: [[GUID,number],[GUID,number]][];
        removed: [[GUID,number],[GUID,number]][]
    }
    constructor(){
        this.node = {
            added : [],
            errors: [],
            removed: [],
            updated: []
        };
        this.connection = {
            added: [],
            removed: [],
        }
    }
}

// INFO Simple shop should handle add node, auto connect if between and have information about sequence
// this handle only updating node state and batching, and connecting (think about validating connection)
// node/transformation handles whole update logic