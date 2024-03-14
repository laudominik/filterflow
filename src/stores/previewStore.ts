import { IEngine } from "../engine/iengine";
import { BaseFilterStore } from "./baseFilterStore";
import type { CanvasPointer, CanvasPosition, GUID, IPreviewStore, IPreviewStores, PreviewSelections } from "./storeInterfaces";
import { Channel } from "./storeInterfaces";
import Transform from "../engine/Transform";
import { Engine } from "../engine/engine";
import { AnyT, jsonMapMember, jsonMember, jsonObject } from "typedjson";

@jsonObject
export abstract class PreviewStores extends BaseFilterStore implements IPreviewStores{
    
    @jsonMapMember(String,() => PreviewStore)
    previewStores: Map<string,PreviewStore>
    previewListeners: CallableFunction[]

    constructor(engine: Engine){
        super(engine);
        this.previewStores = new Map();
        this.previewListeners = [];
    }

    public subscribePreviews(listener: CallableFunction) {
        this.previewListeners = [...this.previewListeners, listener]
        return () => {
            this.previewListeners = this.previewListeners.filter(l => l != listener);
        };
    }

    public emitChangePreviews(){
        this.previewListeners.forEach((v) => v())
    }

    getPreviews(): Map<string, IPreviewStore> {
        return this.previewStores;
    }

    getPreviewStore(name: string): IPreviewStore | undefined {
        return this.previewStores.get(name);
    }
    addPreviewStore(name: string,inputs: GUID[],output: GUID): void {
        this.previewStores.set(name, new PreviewStore(inputs,output));
        this.emitChangePreviews()
    }
    removePreviewStore(name: string): void {
        if(this.previewStores.delete(name)) this.emitChangePreviews()
    }

}

@jsonObject
export class PreviewStore implements IPreviewStore{
    @jsonMember(AnyT)
    context: {
        inputs: GUID[]
        output: GUID,
        visualizationEnabled: boolean
    }

    @jsonMember(AnyT)
    selection: {
        pointer: CanvasPointer
        preview: PreviewSelections
        channel: Channel
    }

    selectionListener: CallableFunction[]
    contextListener: CallableFunction[]
    @jsonMember(Boolean)
    selectionLocked: boolean

    constructor(inputs: GUID[],output:GUID){
        this.context = {inputs, output, visualizationEnabled: false};
        this.selectionListener = [];
        this.contextListener = [];
        this.selectionLocked = false;
        this.selection = {
            pointer: {destination: [0,0],source:[0,0]},
            preview: {destination: {center:[0,0],size:[0,0],start: [0,0]},source:{center:[0,0],size:[0,0],start: [0,0]}},
            channel: Channel.NONE
        }
    }

    getSelection(){
        return this.selection
    }

    subscribeSelection(listener: CallableFunction){
        this.selectionListener = [...this.selectionListener,listener]
        return () => {
            this.selectionListener = this.selectionListener.filter( v => v != listener)
        }
    }

    updateSelection(pointer: CanvasPointer, preview: PreviewSelections, channel: Channel){
        this.selection = {pointer,preview, channel};
        this.selectionListener.forEach(v => v())
    }
    
    updateContext(inputs: GUID[],output: GUID, visualization: boolean){
        this.context = {inputs,output, visualizationEnabled: visualization};
        this.contextListener.forEach( v => v());
    }

    updateSelectionLocked(locked: boolean){
        this.selectionLocked = locked
    }

    getSelectionLocked(){
        return this.selectionLocked
    }

    getContext(){
        return this.context
    }

    subscribeContext(listener: CallableFunction){
        this.contextListener = [...this.contextListener,listener]
        return () => {
            this.contextListener = this.contextListener.filter( v => v != listener)
        }
    }
}