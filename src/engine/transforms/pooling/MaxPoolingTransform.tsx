import { jsonObject } from "typedjson";
import Transform from "../../Transform";

@jsonObject
class MaxPoolingTransform extends Transform {
    public _update_node(): void {
        throw new Error("Method not implemented.");
    }
    constructor() {
        super('Max pooling', '#E2E7F4');
    }

    paramView() {
        // TODO: show the kernel size and kernel view
        /*
         *  tbd: how could we split the view logic here and keep it nice and tidy
         */
        return <div>max pool</div>
    }

    visualizationView(guid: string) {
        return <></>
    }

    updateParams(parameters: { [key: string]: any }): void {
        // TODO: update mask
        /*
         *  tbd: should we use builder pattern and rebuild the transformations
         *  or just update params
         */
    }
}

export default MaxPoolingTransform;