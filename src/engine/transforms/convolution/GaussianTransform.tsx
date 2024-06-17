
import { jsonObject } from "typedjson";
import ConvolutionTransform from "../ConvolutionTransform";

@jsonObject({name:"GaussianTransform"})
class GaussianTransform extends ConvolutionTransform {
    constructor() {
        super('Gaussian');
        this.kernel = [[1/16,  1/8,  1/16   ],
                       [1/8,   1/4,  1/8    ],
                       [1/16,  1/8,  1/16   ]]; 

        this.params = {...this.params, "kernel" : this.kernel};
        this.edited = false;
    }
}

export default GaussianTransform;