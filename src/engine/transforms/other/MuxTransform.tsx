import { ReactElement, JSXElementConstructor } from "react";
import Transform from "../../Transform";

export default class MuxTransform extends Transform {
    constructor(name?: string) {
        super("Mux", '#E6F4E2');
        this.selected = 0;
        this.params = {...this.params, "selected" : this.selected};
        this.meta.input_size = 2;
    }
    public _update_node(): void {
        // based on input connections perform calculations
        let [parent1, _] = this.inputs.get(0)!;
        let [parent2, __] = this.inputs.get(1)!;

        let input1 = this.engine.getNode(parent1)?.canvas;
        let input2 = this.engine.getNode(parent2)?.canvas;

        this.applyTwo(input1, input2);
    }


    paramView(guid: string): ReactElement<any, string | JSXElementConstructor<any>> {
        return <></>
    }

    async applyTwo(input1: OffscreenCanvas | undefined, input2: OffscreenCanvas | undefined){
        if(!input1 || !input2){
            return;
        }
        
        this.hash = crypto.randomUUID();
        
        this.selected = this.params["selected"]
        if(this.selected){
            this.canvas = input2;
        } else {
            this.canvas = input1;
        }
    }

    selected: number;

}