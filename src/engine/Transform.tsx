import 'reflect-metadata'
import { ReactElement, ReactNode } from 'react'
import { GUID } from './engine'
import { AnyT, jsonMember, jsonObject } from 'typedjson';
import { node } from './node';
import { CanvasSelection } from '../stores/simpleFilterStore';

export interface KVParams {
    [key: string]: any
}

@jsonObject
abstract class Transform extends node<Transform> {
    constructor(name: string, color: string){
        super({id:crypto.randomUUID(),inputs:1,outputs:1,channel:new EventTarget()});
        this.color = color;
        this.name = name;
        this.params = {};
        this.enabled = true;
        this.expanded = false;
        this.edited = true;
        this.canvas = new OffscreenCanvas(1,1);
        this.gl = this.canvas.getContext("webgl", {preserveDrawingBuffer: true})!;
        this.hash = crypto.randomUUID();
    }

    abstract paramView(guid: GUID): ReactElement;
    
    visualizationView(guid: GUID) {
        return <></>
    };

    // TODO add meta to promise (about color)
    async apply(input:OffscreenCanvas|undefined): Promise<OffscreenCanvas|undefined>{
        if(!this.enabled || input === undefined) {
            return input;
        }

        // TODO: remove setting state in transform?
        this.hash = crypto.randomUUID();
        return await this._apply(input);
    }

    async _apply(input:OffscreenCanvas): Promise<OffscreenCanvas> {
        return input;
    }

    // TODO: better naming?
    public fromDestinationToSourcePosition(positon: [number, number]): [number, number] {
        return positon
    }

    public fromSourceToDestinationPosition(positon: [number, number]): [number, number] {
        return positon
    }

    public getPixels(position: [number, number], size: [number, number], result?: Uint8Array): Uint8Array{
        const arrayLength = 4 * size[0] * size[1] // 4 for RGBA bits
        if(!result || result.length < arrayLength)
            result = new Uint8Array(arrayLength)

        this.gl.readPixels(position[0], position[1], size[0], size[1], this.gl.RGBA, this.gl.UNSIGNED_BYTE, result);
        return result
    }

    public fromPositionToSelection(position: [number, number]): CanvasSelection{
        return {start: position, size:[1,1], center: position}
    }

    public fromPositionToSourceSelection(position: [number, number]): CanvasSelection {
        return {start: position, size: [1,1], center: position}
    }

    public getImageString(): string {
        return this.image ?? "";
    }

    public getCanvas(): OffscreenCanvas {
        return this.canvas
    }

    public getWebGLContext(): WebGLRenderingContext {
        return this.gl
    }

    public getHash(): GUID{
        return this.hash
    }

    async setImageString(image: string) {
        this.image = image;
    }

    setEnabled(enabled: boolean){
        this.enabled = enabled
    }

    getEnabled(){
        return this.enabled
    }

    setExpanded(expanded: boolean){
        this.expanded = expanded
    }

    getExpanded(){
        return this.expanded
    }

    updateParams(params: KVParams): void {
        this.params = params;
        if (this.edited == false){
            this.name =  `${this.name}[edited]`
            this.hash = crypto.randomUUID();
        }
        this.edited = true;
    }

    getParams() : KVParams {
        return this.params;
    }

    getColor(): string {
        return this.color;
    }

    getName(): string {
        return this.name;
    }

    @jsonMember(String)
    color: string;
    @jsonMember(String)
    name: string;
    @jsonMember(String)
    image?: string;
    @jsonMember(Boolean)
    edited: boolean;
    @jsonMember(Boolean)
    enabled: boolean;
    @jsonMember(Boolean)
    expanded: boolean;
    @jsonMember(AnyT)
    params: KVParams;
    hash: GUID;
    canvas: OffscreenCanvas;
    gl: WebGLRenderingContext;
}

export default Transform