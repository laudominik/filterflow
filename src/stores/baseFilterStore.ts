// Engine core functionalities

import {jsonArrayMember, jsonMember, jsonObject} from "typedjson";
import Transform, {KVParams} from "../engine/Transform";
import {IEngine, GUID} from "../engine/iengine"
import {INodeStore} from "./storeInterfaces";
import {Engine} from "../engine/engine";

type MarkedListener = CallableFunction & {id: GUID}

@jsonObject
export abstract class BaseFilterStore implements INodeStore {
    @jsonMember(() => Engine)
    engine: Engine

    // listen on node change
    nodeListeners: {listener: CallableFunction, id: GUID}[]
    // store Transform in new object to trigger react update
    nodeWrappers: Map<GUID, {value: Transform, hash: string}>

    nodeCollectionListener: CallableFunction[]
    @jsonArrayMember(String)
    nodeCollection: GUID[]

    constructor(engine: Engine) {
        this.engine = engine;
        this.nodeListeners = [];
        this.nodeWrappers = new Map();
        this.nodeCollection = [];
        this.nodeCollectionListener = [];
    }

    //#region Node

    // internal function register listening on specific id
    private _subscribeNode(id: GUID, listener: CallableFunction) {
        this.nodeListeners = [...this.nodeListeners, {listener, id}]
        return () => {
            this.nodeListeners = this.nodeListeners.filter(l => l.listener != listener);
        };
    }

    public subscribeNode(id: GUID) {
        return this._subscribeNode.bind(this, id);
    }

    public getNode(id: GUID) {
        return this._getNode.bind(this, id)
    }

    private _getNode(id: GUID): {value: Transform, hash: string} {
        let transformWatch = this.nodeWrappers.get(id);
        if (transformWatch) {

            if (transformWatch.hash != transformWatch.value.hash) {
                transformWatch = {...transformWatch, hash: transformWatch.value.hash};
                this.nodeWrappers.set(id, transformWatch);
            }
        } else {
            const transform = this.engine.getNode(id)!;
            if (!transform) {
                debugger;
                console.trace()
                throw "calling not existent node from frontend";
            }
            transformWatch = {value: transform, hash: transform.hash};
            this.nodeWrappers.set(id, transformWatch);
        }
        return transformWatch
    }

    private emitChangeNode(id: GUID) {
        this.nodeListeners.filter(f => f.id === id).forEach(f => f.listener())
    }
    //#endregion

    //#region Node Collection
    public getNodeCollection() {
        return this.nodeCollection;
    }

    public subscribeNodeCollection(listener: CallableFunction) {
        this.nodeCollectionListener = [...this.nodeCollectionListener, listener]
        return () => {
            this.nodeCollectionListener = this.nodeCollectionListener.filter(l => l != listener);
        };
    }

    public emitChangeNodeCollection() {
        this.nodeCollectionListener.forEach((v) => v())
    }

    //#endregion

    //#region Engine exports

    public updateParam(id: GUID, param: KVParams) {
        this.engine.updateNodeParams(id, param)
    }

    public addTransform(name: string, params: KVParams = {}): Transform {
        params.engine = this.engine;
        const guid = this.engine.addNode(name, params);
        return this.engine.getNode(guid)!;
    }

    public removeTransform(id: GUID) {
        this.engine.removeNode(id);
    }

    // #endregion 

    //#region Persistence
    // #endregion
}