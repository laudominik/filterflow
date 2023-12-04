import { createContext, createRef, useEffect, useRef } from "react";
import Transform  from '../engine/Transform'
import { Engine, GUID } from "../engine/engine";

type MarkedListener = CallableFunction & { id: GUID }


class simpleFilterStore {
    listeners: MarkedListener[]
    sequenceListener:CallableFunction[]
    engine: Engine

    source: GUID
    sequence:GUID[]

    constructor() {
        this.listeners = [];
        this.sequence = [];
        this.sequenceListener = [];
        this.engine = new Engine();
        this.source = this.engine.addNode("source",{})
    }

    // per item section
    // internal function called to return snapshot of data with id
    private _getView(id: GUID): string | undefined {
        return this.engine.getNode(id)?.getImageString();
    }

    private _getParams(id: GUID) {
        return this.engine.getNode(id)?.getParams();
    }

    // internal function register listening on specific id
    private _subscribe(id: GUID, listener: MarkedListener) {
        listener.id = id;
        this.listeners = [...this.listeners, listener]
        return () => {
            this.listeners = this.listeners.filter(l => l != listener);
        };
    }

    // helper functions
    // due to inability to pass additional args its the best way to add args
    public subscribe(id: GUID) {
        return this._subscribe.bind(this, id);
    }

    public getView(id: GUID) {
        return this._getView.bind(this, id);
    }

    public getParams(id: GUID){
        return this._getParams.bind(this, id);
    }

    public getTransform(id: GUID): Transform{
        return this.engine.getNode(id)!
    }

    // item sequence
    public getSequence(): GUID[]{
        return this.sequence;
    }

    public subscribeSequence(listener: CallableFunction){
        this.sequenceListener = [...this.sequenceListener, listener]
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
        this.applyTransforms()
    }

    public removeFromSequence(id: GUID){
        this.sequence = this.sequence.filter(guid => guid !== id);
        this.emitSequenceChange()
    }

    // set filter store root mask what is happening with data
    public setSource(imageEncoded: string) {
        this.engine.getNode(this.source)?.updateParams({"image":imageEncoded});
        this.emitChange(this.source)
    }

    public lastNode(){
        if(this.sequence.length == 0){
            return this.source;
        }
        return this.sequence[this.sequence.length - 1]
    }

    public emitChange(id: GUID) {
        this.listeners.filter(f => f.id === id).forEach(f => f())
    }

    public applyTransforms(){
        if(!this.engine.getNode(this.source)) return;
        const image = this.engine.getNode(this.source)?.getImageString() ?? "";
        
        const reducer = async(image: Promise<string>, guid: GUID): Promise<string> => {
            console.log(guid)
            return this.engine.getNode(guid)?.apply(await image) || "";
        }
        this.sequence.reduce(reducer, Promise.resolve(image)).then(_ => {
            this.emitChange(this.lastNode())
            console.log("change emitted")
        });
    }
};

const FilterStoreContext = createContext(new simpleFilterStore()) // using it without provider makes it global

export { FilterStoreContext }