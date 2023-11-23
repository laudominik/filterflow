import { ReactNode } from 'react'

abstract class Transform {
    constructor(name: string, color: string){
        this.color = color;
        this.name = name;
    }

    abstract apply(from:string): string;
    abstract updateParams(params: { [key: string]: any}): void;
    abstract paramView(): ReactNode;
    abstract getImageString(): string;

    getColor(): string {
        return this.color;
    }

    getName(): string {
        return this.name;
    }

    color: string;
    name: string;
}

export default Transform