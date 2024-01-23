import { jsonObject } from "typedjson";
import Transform from "../../Transform";
import PoolingTransform from "../PoolingTransform";
import PoolingVisualizationComponent from "../../../components/visualizations/PoolingVisualizationComponent";

@jsonObject
class MaxPoolingTransform extends PoolingTransform {
    public _update_node(): void {
        throw new Error("Method not implemented.");
    }
    constructor() {
        super('Max pooling', 
        `
            if(pixelColor.r >= outVal.r){
                outVal.r = pixelColor.r;
            }
            if(pixelColor.g >= outVal.g){
                outVal.g = pixelColor.g;
            }
            if(pixelColor.b >= outVal.b){
                outVal.b = pixelColor.b;
            }
        `
       );
    }

    visualizationView(guid: string) {
        return <PoolingVisualizationComponent guid={guid} type="max" reduction={Math.max}/>
    }
}

export default MaxPoolingTransform;