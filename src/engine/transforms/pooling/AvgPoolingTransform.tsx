import { jsonObject } from "typedjson";
import Transform from "../../Transform";
import PoolingTransform from "../PoolingTransform";

@jsonObject
class AvgPoolingTransform extends PoolingTransform {
    public _update_node(): void {
        throw new Error("Method not implemented.");
    }
    constructor() {
        super('Average pooling', 
        `
            outVal += 1.0/(float(u_pooling_size) * float(u_pooling_size)) * pixelColor;
        `
       );
    }
}

export default AvgPoolingTransform;