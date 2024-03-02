import { jsonObject } from "typedjson";
import Transform from "../../Transform";
import PoolingTransform from "../PoolingTransform";
import PoolingVisualizationComponent from "../../../components/visualizations/PoolingVisualizationComponent";

@jsonObject
class AvgPoolingTransform extends PoolingTransform {

    constructor() {
        super('Average pooling', 
        `
            outVal += 1.0/(float(u_pooling_size) * float(u_pooling_size)) * pixelColor;
        `
       );
    }

    visualizationView(guid: string) {
        let reduction = (...values: number[]) => {
            return values.reduce((p, el) => el + p, 0)/values.length
        }
        return <PoolingVisualizationComponent guid={guid} type="avg" reduction={reduction}/>
    }
}

export default AvgPoolingTransform;