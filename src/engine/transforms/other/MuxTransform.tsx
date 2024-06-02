import {ReactElement, JSXElementConstructor} from "react";
import Transform from "../../Transform";
import {jsonObject} from "typedjson";
import MuxComponent from "../../../components/transforms/MuxComponent";

@jsonObject
export default class MuxTransform extends Transform {
    constructor(name?: string) {
        super("Mux", '#FF0000');
        this.selected = 0;
        this.meta.input_size = 2;
        this.params = {...this.params, "selected": this.selected, "muxedInputs": this.meta.input_size};
    }

    public could_update(): boolean {
        this.meta.input_size = this.params["muxedInputs"]
        return this.inputs.has(this.params["selected"]);
    }

    paramView(guid: string): ReactElement<any, string | JSXElementConstructor<any>> {
        return <MuxComponent guid={guid} />
    }

    async apply(input: Array<OffscreenCanvas | undefined>): Promise<OffscreenCanvas | undefined> {
        this.selected = this.params["selected"];
        if (!input.length || input[this.selected] === undefined) {
            return undefined
        }
        this.hash = crypto.randomUUID();
        const ret = await this._apply(input as Array<OffscreenCanvas>);
        return ret;
    }

    _apply(input: OffscreenCanvas[]): Promise<OffscreenCanvas> {
        this.meta.input_size = this.params["muxedInputs"]
        this.canvas = input[this.selected]
        //@ts-ignore
        return this.canvas;
    }

    selected: number;

}