import { jsonObject } from "typedjson";
import Transform from "../../Transform";
import PoolingTransform from "../PoolingTransform";
import PoolingVisualizationComponent from "../../../components/visualizations/PoolingVisualizationComponent";

@jsonObject
class MinPoolingTransform extends PoolingTransform {
    public _update_node(): void {
        throw new Error("Method not implemented.");
    }
    constructor() {
        super('Min pooling', 
        `
            if(pixelColor.r <= outVal.r){
                outVal.r = pixelColor.r;
            }
            if(pixelColor.g <= outVal.g){
                outVal.g = pixelColor.g;
            }
            if(pixelColor.b <= outVal.b){
                outVal.b = pixelColor.b;
            }
        `, 
        'vec3(1.0,1.0,1.0)'
       )
    }

    visualizationView(guid: string) {
        return <PoolingVisualizationComponent guid={guid} type="min" reduction={Math.min}/>
    }
}

export default MinPoolingTransform;