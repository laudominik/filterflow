import { ReactNode } from "react";
import Transform from "../Transform";

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