import Transform from "./Transform";
import FilterTransform from "./transforms/FilterTransform";
import SourceTransform from "./transforms/SourceTransform";
import SourceTransfrom from "./transforms/SourceTransform";

// weakly typed for time being
interface IAction{
    INFO_NODE_UPDATED:string, // node was updated info
    DISPATCH_NODE_UPDATE: string, // dispatch update to next node
    ERROR_NODE_INPUT: string // send MSG that update is imposible (error on input)
}

export type GUID = string;

interface NodeResponseUpdated{
    nodeId: GUID,
    status: "updated",
    requestUpdates: GUID[]
}


interface NodeResponseError{
    nodeId: GUID,
    status: "error",
    invalidateChildrens: GUID[] // if error ocure in parent tree all childeren are invalid
    // children should emit same error TODO add handle to send invalidateNode or we want to handle it difrently
} // error msg or status avalible on node

// type that will be send to internal
type NodeResponse = NodeResponseUpdated | NodeResponseError 

// FLOW
// node get updatedParams
// node request to update self

// node was requested to update
// node get updated
// node notify engine that is was updated and send what next should be updated

// loop
// engine decide that its time to notify parent that internal state changed 


// Engine send events to parent element (logic decupling)
export class Engine extends EventTarget{
    // internal is comunication from graph components to graph components, with information collection by engine
    // this enable better batching of updates
    internal: EventTarget // i'm not sure if this is sequence stable for now batches
    // engine should call node in async
    // this is only for async return (ensure that some msg is always send, otherwise batching in this implementation will break) 
    
    batchState: {
       response: ExternalEngineResponse
       pendingUpdates: Set<GUID> // basicly open updates, that wait for return
    }
    
    nodes: Map<GUID,Transform>

    constructor(){
        super()
        this.internal = new EventTarget();
        this.batchState = {
            response: new ExternalEngineResponse(),
            pendingUpdates: new Set()
        }
        this.nodes = new Map()
        this.internal.addEventListener("info",this.handleInternalInfo)

    }

    // called internaly nodes are the sources of this request
    private updateNode(node:GUID, updateSource: "update" | "error" | "self") {
        // TODO what about input nodes they are not pending when inserting non static image
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
        const guid = crypto.randomUUID();
        // TODO get from map[name] -> object (builder)
        if(transformation == "source"){
            this.nodes.set(guid, new SourceTransform());
        } else if(transformation == "custom_kernel"){
            this.nodes.set(guid, new FilterTransform());
        }
        
        return guid
    }

    public connectNodes(source:GUID,destination:GUID,source_handle: Number,destination_handle:Number): boolean{
        return false
    }

    public disconnectNodes(source:GUID,destination:GUID,source_handle: Number,destination_handle:Number): boolean{
        return false
    }

    public getNode(node:GUID): Transform | undefined {
        return this.nodes.get(node)
    }

    private handleInternalInfo(event: Event) {
        // batch or send direclty
        // TODO perfect this
        // EXAMPLE this.updateNode(event) call update on nodes
        // EXAMPLE this.dispatchEvent(event) send info about update
        // TODO mark node update as finished
        // TODO 
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