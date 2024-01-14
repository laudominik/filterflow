import { createContext, createRef, useEffect, useRef } from "react";
import Transform  from '../engine/Transform'
import { Engine, GUID } from "../engine/engine";
import { TypedJSON } from "typedjson";

type MarkedListener = CallableFunction & { id: GUID }
type PreviewType = {start: GUID, end: GUID, distance: Number}

// For now we support only rectangles as selection
type CanvasPosition = [number, number]
type CanvasPointer = {source: CanvasPosition ,destination: CanvasPosition}
type CanvasSelection = {source: {start: CanvasPosition, size: CanvasPosition, selected: CanvasPosition}, destination: {start: CanvasPosition, size: CanvasPosition, selected: CanvasPosition}}


class simpleFilterStore {
    listeners: MarkedListener[]
    sequenceListener:CallableFunction[]
    engine: Engine
    previewListeners: CallableFunction[]
    canvasSelectionsListeners: CallableFunction[]


    source: GUID
    sequence:GUID[]
    preview: PreviewType // distance == 1 preview will work
    canvasPointers: CanvasPointer
    canvasSelections: CanvasSelection

    constructor() {
        this.listeners = [];
        this.sequenceListener = [];
        this.previewListeners = [];
        this.canvasSelectionsListeners=[];

        const storedEngine = sessionStorage.getItem("engine");
        const storedSequence = sessionStorage.getItem("sequence");
        const storedSource = sessionStorage.getItem("source");
        const storedPreview = sessionStorage.getItem("preview")
        const storedCanvasPointers = sessionStorage.getItem("canvasPointers")
        const storedCanvasSelections = sessionStorage.getItem("canvasSelections")

        if(!storedEngine || !storedSequence || !storedSource || !storedPreview || !storedCanvasPointers || !storedCanvasSelections) {
            this.sequence = [];
            this.engine = new Engine();
            this.source = this.engine.addNode("source", {});
            this.preview = {start: this.source,end: this.source, distance: 0}
            this.canvasPointers = {source: [0,0],destination:[0,0]} 
            this.canvasSelections = {source: {start: [0,0], size: [0,0], selected:[0,0]},destination:{start: [0,0], size: [0,0], selected: [0,0]}} 
            return;
        }

        const serializer = new TypedJSON(Engine)
        console.log(storedEngine)
        this.engine = serializer.parse(storedEngine)!;
        this.sequence = JSON.parse(storedSequence!);
        this.source = JSON.parse(storedSource!);
        this.preview = JSON.parse(storedPreview!);
        this.canvasPointers = JSON.parse(storedCanvasPointers!);
        this.canvasSelections = JSON.parse(storedCanvasSelections!);
        console.log(this.engine)
        this.applyTransforms()
        this.emitSequenceChange();
    }

    // per item section
    // internal function called to return snapshot of data with id
    private _getView(id: GUID) {
        return this.engine.getNode(id)?.getCanvas()
    }

    private _getHash(id: GUID){
        return this.engine.getNode(id)?.getHash()
    }

    private _getParams(id: GUID) {
        return this.engine.getNode(id)?.getParams();
    }

    private _getPixels(id: GUID) {
        return this.engine.getNode(id)?.getSelectedPixels()
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

    public getPixels(id: GUID) {
        return this._getPixels.bind(this, id);
    }

    public getHash(id: GUID){
        return this._getHash.bind(this, id);
    }

    public getParams(id: GUID){
        return this._getParams.bind(this, id);
    }

    public getTransform(id: GUID): Transform{
        return this.engine.getNode(id)!
    }

    // preview
    public getPreview(){
        return this.preview;
    }

    public subscribePreview(listener: CallableFunction){
        this.previewListeners = [...this.previewListeners, listener]
        return () => {
            this.previewListeners = this.previewListeners.filter(l => l !== listener);
        };
    }

    private emitPreview(){
        this.previewListeners.forEach(f => f());
    }

    // canvasPointers
    public getCanvasPointers(){
        return this.canvasPointers;
    }

    public getCanvasSelections(){
        return this.canvasSelections;
    }

    public subscribeCanvasSelections(listener: CallableFunction){
        this.canvasSelectionsListeners = [...this.canvasSelectionsListeners, listener]
        return () => {
            this.canvasSelectionsListeners = this.canvasSelectionsListeners.filter(l => l !== listener);
        };
    }

    private emitCanvasSelections(){
        this.canvasSelectionsListeners.forEach(f => f());
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
    
    private distance(start: GUID, stop: GUID) : Number{
        if (start == stop){
            return 0;
        }
        let distance = 0;
        let i = 0;
        // find start
        if (start != this.source){
            while(true){
                const uuid = this.sequence[i];
                i+=1;
                if (uuid == start){
                    if (!this.engine.getNode(uuid)?.enabled){
                        return -1;
                    }
                    distance+=1;
                }
            }
        }else{
            distance+=1;
        }

        while(true){
            const uuid = this.sequence[i];
            if (uuid == stop){
                return distance;
            }
            
            i+=1;
            if (this.engine.getNode(uuid)?.enabled){
                distance+=1;
            }
        }
    }

    private emitSequenceChange() {
        this.sequenceListener.forEach(f => f())
        // for time being i will leave this here
        let last = this.lastNode();
        this.preview = {start: this.source, distance: this.distance(this.source,last),end: last};
        this.emitPreview();
    }

    private applyVisualization() {
        const source = this.engine.getNode(this.preview.start)!.getWebGLContext()
        const node = this.engine.getNode(this.preview.end)
        node!.visualization(source, this.canvasPointers.source)
        const sourceSelection = node?.sourceSelection
        const selection = node?.selection
        
        if(!sourceSelection || !selection) return
        this.canvasSelections = {source: sourceSelection, destination: selection} 
    }

    public addTransform(name: string){
        this.sequence = [...this.sequence, this.engine.addNode(name, {})];
        this.emitSequenceChange();
        this.commitToPersistentStore();
    }

    public setCanvasDestinationPointer(position: [number, number]){
        this.canvasPointers = {source: position, destination: position};
        // TODO: add proper calculation of position on source
        this.applyVisualization();
        this.emitCanvasSelections();
    }

    public setCanvasSourcePointer(position: [number, number]){
        this.canvasPointers = {destination: position, source: position};
        this.applyVisualization();
        this.emitCanvasSelections();
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
        this.commitToPersistentStore()
    }

    public removeFromSequence(id: GUID){
        this.sequence = this.sequence.filter(guid => guid !== id);
        this.emitSequenceChange()
        this.commitToPersistentStore()
    }

    public setEnabled(id: GUID, value: boolean){
        let node = this.engine.getNode(id)
        if(node){
            node.setEnabled(value)
            this.emitSequenceChange()
            this.applyTransforms()
        } 
    }

    // set filter store root mask what is happening with data
    public async setSource(imageEncoded: string) {
        await this.engine.getNode(this.source)?.setImageString(imageEncoded);

        this.emitChange(this.source)
        this.commitToPersistentStore()
    }

    public lastNode(){
        let i = this.sequence.length;
        while (true) {
            if(i === 0){
                return this.source;
            }
            const uuid = this.sequence[i-1];
            if (this.engine.getNode(uuid)?.enabled){
                return uuid
            }
            i-=1;
        }
        
    }

    private emitChange(id: GUID) {
        this.listeners.filter(f => f.id === id).forEach(f => f())
    }

    public applyTransforms(){
        if(!this.engine.getNode(this.source)) return;
        const image = this.engine.getNode(this.source)?.getCanvas();
        
        const reducer = async(image: Promise<OffscreenCanvas | undefined>, guid: GUID): Promise<OffscreenCanvas | undefined> => {
            return this.engine.getNode(guid)?.apply(await image);
        }
        this.sequence.reduce(reducer, Promise.resolve(image)).then(_ => {
            this.emitChange(this.lastNode())
        });
        this.commitToPersistentStore();
    }

    public commitToPersistentStore(){
        const serializer = new TypedJSON(Engine)
        console.log("pre serialization: ", this.engine)
        sessionStorage.setItem("engine",  serializer.stringify(this.engine));
        sessionStorage.setItem("source", JSON.stringify(this.source));
        sessionStorage.setItem("sequence", JSON.stringify(this.sequence));
        sessionStorage.setItem("preview",JSON.stringify(this.preview));
        sessionStorage.setItem("canvasPointers",JSON.stringify(this.canvasPointers));
        sessionStorage.setItem("canvasSelections",JSON.stringify(this.canvasSelections));
    }
};

const FilterStoreContext = createContext(new simpleFilterStore()) // using it without provider makes it global

export { FilterStoreContext }
export type { CanvasPointer, CanvasSelection }