import { ReactElement, JSXElementConstructor } from "react";
import Transform from "../../Transform";
import { jsonObject } from "typedjson";
import MuxComponent from "../../../components/transforms/MuxComponent";

@jsonObject
export default class MuxTransform extends Transform {
    constructor(name?: string) {
        super("Mux", '#E6F4E2');
        this.selected = 0;
        this.meta.input_size = 2;
        this.params = {...this.params, "selected" : this.selected, "muxedInputs": this.meta.input_size};
    }
    public _update_node(): void {
        // based on input connections perform calculations
        this.meta.input_size = this.params["muxedInputs"]
        console.log(this.meta.input_size)
        const input = [...Array(this.meta.input_size)].map((_, ix) => {
            const pair = this.inputs.get(ix)
            console.log(pair)
            if(!pair) return undefined;
            return this.engine.getNode(pair[0])?.canvas
        })
        this.apply(input);
    }


    paramView(guid: string): ReactElement<any, string | JSXElementConstructor<any>> {
        return <MuxComponent guid={guid}/>
    }

    _apply(input: OffscreenCanvas[]): Promise<OffscreenCanvas> {
        this.selected = this.params["selected"];
        this.canvas = input[this.selected]
        //@ts-ignore
        return this.canvas;
    }

    selected: number;

}