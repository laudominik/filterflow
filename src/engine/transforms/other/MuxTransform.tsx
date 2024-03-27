import { ReactElement, JSXElementConstructor } from "react";
import Transform from "../../Transform";
import { jsonObject } from "typedjson";
import MuxComponent from "../../../components/transforms/MuxComponent";

@jsonObject
export default class MuxTransform extends Transform {
    constructor(name?: string) {
        super("Mux", '#F8B195');
        this.selected = 0;
        this.meta.input_size = 2;
        this.params = {...this.params, "selected" : this.selected, "muxedInputs": this.meta.input_size};
    }


    paramView(guid: string): ReactElement<any, string | JSXElementConstructor<any>> {
        return <MuxComponent guid={guid}/>
    }

    _apply(input: OffscreenCanvas[]): Promise<OffscreenCanvas> {
        this.selected = this.params["selected"];
        this.meta.input_size = this.params["muxedInputs"]
        this.canvas = input[this.selected]
        //@ts-ignore
        return this.canvas;
    }

    selected: number;

}