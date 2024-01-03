import 'reflect-metadata'
import { ReactNode } from 'react'
import { GUID } from './engine'
import { AnyT, jsonMember, jsonObject } from 'typedjson';
import { node } from './node';

interface KVParams {
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
        this.canvas = new OffscreenCanvas(1,1);
        this.hash = crypto.randomUUID();
    }

    abstract paramView(guid: GUID): ReactNode;

    async apply(input:OffscreenCanvas|undefined): Promise<OffscreenCanvas|undefined>{
        if(!this.enabled || input === undefined) {
            return input;
        }
        this.hash = crypto.randomUUID();
        return await this._apply(input);
    }

    async _apply(input:OffscreenCanvas): Promise<OffscreenCanvas> {
        return input;
    }

    public getImageString(): string {
        return this.image ?? "";
    }

    public getCanvas(): OffscreenCanvas {
        return this.canvas
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
    enabled: boolean;
    @jsonMember(Boolean)
    expanded: boolean;
    @jsonMember(AnyT)
    params: KVParams;
    hash: GUID;
    canvas: OffscreenCanvas;
}

export default Transform