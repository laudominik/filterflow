import {jsonArrayMember, jsonMapMember, jsonMember, jsonObject} from "typedjson";
import Transform, {KVParams} from "./Transform";
import mapToTransform, {knownTypes} from "./TransformDeclarations";
import {connect, disconnect} from './node';
import {NodeResponse} from './nodeResponse';
import {IEngine} from "./iengine";

export type GUID = string;
// TODO: add mechanism to detect locked state (count if any process is executing)
// FLOW
// node get updatedParams
// node request to update self

// node was requested to update
// node get updated
// node notify engine that is was updated and send what next should be updated

// loop
// engine decide that its time to notify parent that internal state changed 


// Engine sends events to parent element (logic decupling)
@jsonObject({knownTypes: Array.from(knownTypes())})
export class Engine extends EventTarget implements IEngine<Transform>{
    // internal is comunication from graph components to graph components, with information collection by engine
    // this enable better batching of updates
    internal: EventTarget // i'm not sure if this is sequence stable for now batches
    // engine should call node in async
    // this is only for async return (ensure that some msg is always send, otherwise batching in this implementation will break) 

    inTransaction: boolean = false;

    batchState: {
        response: ExternalEngineResponse,
        startedUpdates: Set<GUID>,
        pendingUpdates: Set<GUID>, // basicly open updates, that wait for return
        doneUpdates: Set<GUID>,
        tick: number,
        concurent_updates: number;
    }


    @jsonMapMember(String, Transform)
    nodes: Map<GUID, Transform>

    @jsonArrayMember(String)
    source_nodes: GUID[]

    constructor() {
        super()
        this.internal = new EventTarget();
        this.batchState = {
            tick: 1,
            response: new ExternalEngineResponse(),
            startedUpdates: new Set(),
            pendingUpdates: new Set(),
            doneUpdates: new Set(),
            concurent_updates: 0
        }
        this.nodes = new Map()
        this.source_nodes = []
        this.internal.addEventListener("info", this.handleInternalInfo.bind(this) as any)
        this.internal.addEventListener("connection_remove", this.handleInternalConnectionsRemove.bind(this) as any)
    }

    public requestUpdate(node: GUID): void {
        this.batchState.pendingUpdates.add(node);
    }
    protected transactionStart(): void {
        this.inTransaction = true;
    }

    protected transactionCommit(): void {
        this.inTransaction = false;
        this.startUpdate();
    }

    public _dispatch_update(id: GUID) {
        if (!this.batchState.startedUpdates.has(id)) {
            this.batchState.pendingUpdates.add(id);
            const node = this.getNode(id)
            if (node) {
                if (node.dispatch_update(this.batchState.tick)) {
                    this.batchState.startedUpdates.add(id);
                    this.batchState.concurent_updates += 1;
                }
            } else {
                this.batchState.pendingUpdates.delete(id);
                console.error(`Node: ${id} not exist`)
            }

        }
    }
    public _direct_update(id: GUID) {
        if (!this.batchState.startedUpdates.has(id)) {
            this.batchState.startedUpdates.add(id);
            this.batchState.pendingUpdates.add(id);
            this.batchState.concurent_updates += 1;
            this.getNode(id)!.update_node();
        }
    }

    public async startUpdate(): Promise<void> {
        if (this.inTransaction) return;
        this.source_nodes.forEach((id) => {
            this._direct_update(id);
        })
        if (this.batchState.concurent_updates == 0) {
            console.log("dispatching pending (no source)")
            this.deadLockForceUpdate();
        }
        if (this.batchState.concurent_updates == 0) {
            console.log("Empty update");
            this.flushUpdate();
        }
    }

    public async startUpdateAll(): Promise<void> {
        this.nodes.forEach((node) => {
            if (node.inputs.size != 0) return;
            this._direct_update(node.meta.id);
        })
        if (this.batchState.concurent_updates == 0) {
            console.log("dispatching pending (no source)")
            this.deadLockForceUpdate();
        }
        if (this.batchState.concurent_updates == 0) {
            console.log("Empty update");
            this.flushUpdate();
        }
    }

    private flushUpdate(): void {
        // save deleted nodes state 
        this.batchState.response.node.removed_nodes = [...this.batchState.response.node.removed.map(v => this.getNode(v)!)]
        this.dispatchEvent(new CustomEvent<ExternalEngineResponse>("update", {detail: this.batchState.response}))
        // clean detached nodes
        this.batchState.response.node.removed.forEach(v => this.nodes.delete(v));
        const tick = this.batchState.tick + 1;
        this.batchState = {
            startedUpdates: new Set(),
            doneUpdates: new Set(),
            pendingUpdates: new Set(),
            response: new ExternalEngineResponse(),
            tick: tick,
            concurent_updates: 0
        }
    }

    private deadLockForceUpdate(): void {
        this.batchState.pendingUpdates.forEach(v => {
            this._direct_update(v);
        })
    }

    public updateNodeParams(node: GUID, params: KVParams): void {
        const transform = this.nodes.get(node)
        if (transform === undefined) {
            // TODO think about some error handling
            return
        }
        for (const key in params) {
            this.batchState.response.node.updated_params.push({node_id: node, key, old: transform.params[key], new: params[key]})
        }
        console.log("here!!")
        // if found add to pending
        transform.updateParams(params);
        transform.hash = crypto.randomUUID();
        this.requestUpdate(transform.meta.id);
        this.startUpdate();
    }
    public _addNode(node: Transform) {
        const guid = node.meta.id;
        if (node.meta.input_size == 0) {
            this.source_nodes.push(guid)
        }
        node.engine = this;
        this.nodes.set(guid, node)
        this.batchState.response.node.added.push(guid);
        this.requestUpdate(guid);
        this.startUpdate();
    }

    public addNode(transformation: string, params: any): GUID {
        const node = mapToTransform(transformation)!
        if (params.position) {
            node.setPos(params.position);
        }
        if (params.previewPosition) {
            node.setPreviewPos(params.previewPosition);
        }
        this._addNode(node);
        return node.meta.id;
    }

    public removeNode(guid: GUID) {
        let node = this.getNode(guid);
        node?.disconnect(); // this will not trigger update, only request them
        // this.nodes.delete(guid);
        this.batchState.response.node.removed.push(guid);
        this.source_nodes = this.source_nodes.filter((v) => v != guid);
        this.startUpdate();
    }

    public connectNodes(source: GUID, destination: GUID, source_handle: number, destination_handle: number): boolean {
        let ok = connect(this.nodes.get(source)!, source_handle, this.nodes.get(destination)!, destination_handle)
        if (ok) {
            this.batchState.response.connection.added.push([[source, source_handle], [destination, destination_handle]]);
            this.startUpdate();
        }
        return ok;
    }

    public disconnectNodes(source: GUID, destination: GUID, source_handle: number, destination_handle: number): boolean {
        let ok = disconnect(this.nodes.get(source)!, source_handle, this.nodes.get(destination)!, destination_handle)
        if (ok) {
            this.batchState.response.connection.removed.push([[source, source_handle], [destination, destination_handle]]);
            this.startUpdate();
        } else {
            console.log("didn't delete it")
        }
        return ok;
    }

    public getNode(node: GUID): Transform | undefined {
        return this.nodes.get(node)
    }

    public update_all() {
        this.flushUpdate();
        this.startUpdateAll();
    }

    private handleInternalInfo(event: CustomEvent<NodeResponse>) {

        if (event.detail.status == "updated") {
            const msg = event.detail;
            msg.requestUpdates.forEach((id) => {
                this._dispatch_update(id);
            })
            this.batchState.response.node.updated.push(msg.nodeId);
        } else if (event.detail.status == "error") {
            const msg = event.detail;
            msg.invalidateChildrens.forEach((id) => {
                this._dispatch_update(id);
            })
            this.batchState.response.node.errors.push(event.detail.nodeId);

        } else {
            console.log("undefined msg type");
        }
        if (!this.batchState.doneUpdates.has(event.detail.nodeId)) {
            this.batchState.doneUpdates.add(event.detail.nodeId);
            this.batchState.concurent_updates -= 1;
        }
        // TODO: temporary
        this.getNode(event.detail.nodeId)!.hash = crypto.randomUUID();

        if (this.batchState.concurent_updates == 0) {


            // Desired state all required nodes updated
            if (this.batchState.startedUpdates.size == this.batchState.doneUpdates.size && this.batchState.doneUpdates.size === this.batchState.pendingUpdates.size) {
                this.flushUpdate();
                console.log("batch reset"); // TODO: Remove this later
                return;
            } else { // no update is running (deadlock)
                // TODO: detect if deadlock is caused by loop or disconnected graph part
                console.log("batch deadlock");
                this.deadLockForceUpdate();
            }
        }
    }

    private handleInternalConnectionsRemove(event: CustomEvent<[[GUID, number], [GUID, number]]>) {
        this.batchState.response.connection.removed.push(event.detail);
        // kick node to recalculate state update in child node
        // this.batchState.pendingUpdates.add(event.detail[1][0]);
        const child_guid = event.detail[1][0];
        this.requestUpdate(child_guid);
        // this.getNode()?.req(this.batchState.tick);
        // dispatch will trigger when all child nodes will update ~1s
        // this.dispatchEvent(new CustomEvent<ExternalEngineResponse>("update",{detail:this.batchState.response}))
    }

    private handleInternalConnectionsAdd(event: CustomEvent<[[GUID, number], [GUID, number]]>) {
        this.batchState.response.connection.added.push(event.detail);
        // kick node to recalculate state update in child node
        this.batchState.pendingUpdates.add(event.detail[1][0]);
        this.getNode(event.detail[1][0])?.dispatch_update(this.batchState.tick);
        // dispatch will trigger when all child nodes will update ~1s
        // this.dispatchEvent(new CustomEvent<ExternalEngineResponse>("update",{detail:this.batchState.response}))
    }

    public fixSerialization(): void {
        this.nodes.forEach(n => n.engine = this);
        this.update_all();
    }
}

// this will be send to parent element to inform that some element changed
export class ExternalEngineResponse {
    isHistoryUpdate: boolean = false;
    node: {
        updated: GUID[] // all nodes that finished update successfully
        errors: GUID[]   // all nodes that returned error
        added: GUID[]
        removed: GUID[]
        removed_nodes: Transform[];
        updated_params: {node_id: GUID, key: string, old: any, new: any}[]
    }

    connection: {
        added: [[GUID, number], [GUID, number]][];
        removed: [[GUID, number], [GUID, number]][]
    }
    constructor() {
        this.node = {
            added: [],
            errors: [],
            removed: [],
            updated: [],
            removed_nodes: [],
            updated_params: []
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