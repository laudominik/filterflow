// Engine core functionalities

import Transform, { KVParams } from "../engine/Transform";
import { Engine, GUID } from "../engine/engine"

type MarkedListener = CallableFunction & { id: GUID }

export abstract class BaseFilterStore{
    filename: string
    engine: Engine

    // listen on node change
    nodeListeners: MarkedListener[] 
    // store Transform in new object to trigger react update
    nodeWrappers:  Map<GUID,{value: Transform,hash: string}>
    

    constructor(filename: string, engine: Engine){
        this.filename = filename;
        this.engine = engine;
        this.nodeListeners = [];
        this.nodeWrappers = new Map();
    }
    
    //#region Node

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
    //#endregion

    //#region Engine exports
    
    public updateParam(id: GUID,param: KVParams){
        this.engine.updateNodeParams(id,param)
    }

    public addTransform(name: string,params: KVParams = {}):Transform{
        params.engine = this.engine;
        const guid = this.engine.addNode(name, params);
        this.save();
        return this.engine.getNode(guid)!;
    }

    public removeTransform(id: GUID){
        this.engine.removeNode(id);
    }

    // #endregion 

    //#region Persistence
    public save():void{this.saveAs(this.filename);}
    public abstract saveAs(name: string): void;
    public abstract load(name: string):void;
    // #endregion
}