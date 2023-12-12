import { ReactNode } from "react";
import Transform from "../Transform";
import { jsonObject } from "typedjson";

@jsonObject
export default class SourceTransform extends Transform{
    image?: string

    constructor(){
        super("source","#HEX");
    }

    updateParams(params: { [key: string]: any; }): void {
        this.image = params["image"];
    }
    paramView(): ReactNode {
        return <></>
    }
}