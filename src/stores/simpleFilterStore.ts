import { createContext, createRef, useEffect, useRef } from "react";
import Transform  from '../engine/Transform'
import { Engine, GUID } from "../engine/engine";

type MarkedListener = CallableFunction & { id: GUID }


class simpleFilterStore {
    listeners: MarkedListener[]
    sequenceListener:CallableFunction[]
    engine: Engine

    sequence:GUID[]

    constructor() {
        this.listeners = [];
        this.sequence = [];
        this.sequenceListener=[];
        this.engine = new Engine();
        this.sequence.push(this.engine.addNode("source",{}))
        this.sequence.push(this.engine.addNode("custom_kernel",{}))
    }

    // per item section
    // internal function called to return snapshot of data with id
    private _getView(id: GUID) {
        return this.engine.getNode(id)?.getImageString();
    }

    // internal function register listening on specific id
    private _subscribeView(id: GUID, listener: MarkedListener) {
        listener.id = id;
        this.listeners = [...this.listeners, listener]
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    // helper functions
    // due to inability to pass additional args its the best way to add args
    public subscribeView(id: GUID) {
        return this._subscribeView.bind(this, id);
    }

    public getView(id: GUID) {
        return this._getView.bind(this, id);
    }

    // item sequence
    public getSequence(): GUID[]{
        return this.sequence;
    }

    public subscribeSequence(listener: CallableFunction){
        this.sequenceListener = [...this.listeners, listener]
        return () => {
            this.sequenceListener = this.sequenceListener.filter(l => l !== listener);
        };
    }

    public getTransforms(ids:GUID[]): Transform[] {
        return ids.map(id => this.engine.getNode(id)!);
    }
    
    private emitSequenceChange() {
        this.sequenceListener.forEach(f => f())
    }

    public addTransform(name: string){
        this.sequence = [...this.sequence, this.engine.addNode(name, {})];
        this.emitSequenceChange();
    }

    public rearrange(dragIndex: number, hoverIndex: number){
        const newSequence = [...this.sequence];
        const draggedItem = newSequence[dragIndex];

        newSequence.splice(dragIndex, 1);
        newSequence.splice(hoverIndex, 0, draggedItem);
        this.sequence = [...newSequence];
        // TODO rearange nodes in graph
        this.emitSequenceChange()
    }

    // public setKernel(kernel: string[][]){
    //     this.kernel = kernel;
    //     this.emitChange(69);
    //     if(!this.source) return;
    //     this.applyTransforms(this.source);
    // }

    // set filter store root mask what is happening with data
    public setSource(imageEncoded: string) {
        this.engine.getNode(this.sequence[0])?.updateParams({"image":imageEncoded});
    }

    private emitChange(id: GUID) {
        this.listeners.filter(f => f.id === id).forEach(f => f())
    }

    private applyTransforms(imageEncoded: string){
        
    }
};

const FilterStoreContext = createContext(new simpleFilterStore()) // using it without provider makes it global

export { FilterStoreContext }