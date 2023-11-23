import { ReactNode } from "react";
import Transform from "../Transform";

export default class SourceTransform extends Transform{
    image?: string

    constructor(){
        super("source","#HEX");
    }

    apply(from:string): string {
        return "";
    }
    updateParams(params: { [key: string]: any; }): void {
        this.image = params["image"];
    }
    paramView(): ReactNode {
        return <></>
    }
    getImageString(): string {
        return this.image ?? "";
    }

}