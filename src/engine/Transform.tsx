import 'reflect-metadata'
import { ReactNode } from 'react'
import { GUID } from './engine'
import { AnyT, jsonMember, jsonObject } from 'typedjson';

interface KVParams {
    [key: string]: any
}

@jsonObject
abstract class Transform {
    constructor(name: string, color: string){
        this.color = color;
        this.name = name;
        this.params = {};
        this.enabled = true;
        this.expanded = false;
    }

    abstract paramView(guid: GUID): ReactNode;

    async apply(from:string): Promise<string>{
        if(!this.enabled) {
            this.image = from;
            return from;
        }
        return await this._apply(from);
    }

    async _apply(from:string): Promise<string> {
        return from;
    }

    public getImageString(): string {
        return this.image ?? "";
    }

    setImageString(image: string) {
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
}

export default Transform