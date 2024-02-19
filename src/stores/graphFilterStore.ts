import Transform, { KVParams } from "../engine/Transform"
import { Engine, GUID } from "../engine/engine"

type MarkedListener = CallableFunction & { id: GUID }

type ConnectionSide = [GUID,number];
type ConnectionDefinition = [ConnectionSide,ConnectionSide];
type CanvasPosition = [number,number]; // x y
type CanvasArrow = [CanvasPosition,CanvasPosition]

interface ConnectionInfo{
    connectionDefinition: ConnectionDefinition
    display: CanvasArrow
}


export class GraphFilterStore{
    // listen on node change
    nodeListeners: MarkedListener[] 
    connectionsListener: CallableFunction[]

    connections: ConnectionInfo[]
    // store Transform in new object to trigger react update
    nodeWrappers:  Map<GUID,{value: Transform,hash: string}>

    engine: Engine

    constructor() {
        this.nodeListeners = [];
        this.connectionsListener = [];
        this.connections = [];
        this.nodeWrappers = new Map();
        this.engine = new Engine();

        this.engine.addEventListener("update",this.handleEngineInfo as any)
    }
    
    
    // internal function register listening on specific id
    private _subscribeNode(id: GUID, listener: MarkedListener) {
        listener.id = id;
        this.nodeListeners = [...this.nodeListeners, listener]
        return () => {
            this.nodeListeners = this.nodeListeners.filter(l => l != listener);
        };
    }

    public subscribeNode(id: GUID) {
        return this._subscribeNode.bind(this, id);
    } 

    public getNode(id: GUID): {value: Transform,hash: string}{
        let transformWatch = this.nodeWrappers.get(id);
        if (transformWatch){

            if (transformWatch.hash != transformWatch.value.hash){
                transformWatch = {...transformWatch,hash: transformWatch.value.hash};
                this.nodeWrappers.set(id,transformWatch);
            }
        }else{
            const transform = this.engine.getNode(id)!;
            transformWatch = {value:transform,hash: transform.hash};
            this.nodeWrappers.set(id,transformWatch);
        }
        return transformWatch
    }

    private emitChangeNode(id: GUID) {
        this.nodeListeners.filter(f => f.id === id).forEach(f => f())
    }

    public updateParam(id: GUID,param: KVParams){
        this.engine.getNode(id)!.updateParams(param)
    }

    private handleEngineInfo(event:CustomEvent<any>){
        // TODO handle node update
        // TODO handle connection update
    }

    public getConnections(){
        return this.connections;
    }

    public subscribeConnections(listener: CallableFunction) {
        this.connectionsListener = [...this.connectionsListener, listener]
        return () => {
            this.connectionsListener = this.connectionsListener.filter(l => l != listener);
        };
    } 

}