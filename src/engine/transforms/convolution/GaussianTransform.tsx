import "reflect-metadata"
import { jsonObject } from "typedjson";
import ConvolutionTransform from "../ConvolutionTransform";

@jsonObject
class GaussianTransform extends ConvolutionTransform {
    image?:string
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