import { ReactNode } from 'react'
import { GUID } from './engine'

interface KVParams {
    [key: string]: any
}

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

    getImageString(): string {
        return this.image ?? "";
    }

    setEnabled(enabled: boolean){
        this.enabled = enabled
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

    color: string;
    name: string;
    params: KVParams;
    image?: string;
    enabled: boolean;
    expanded: boolean;
}

export default Transform