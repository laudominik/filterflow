
import "reflect-metadata"
import { jsonObject } from "typedjson";
import ConvolutionTransform from "../ConvolutionTransform";

@jsonObject
class SobelTransform extends ConvolutionTransform {
    image?:string
    constructor(dirX: boolean) {
        super('Sobel');
        this.kernel = dirX ? 
        [[1,     0,  0   ],
         [-2,    0,  0   ],
         [1,     0,  0   ]] :
        [[1,     -2,  1  ],
         [0,    0,  0   ],
         [0,     0,  0   ]] 

        this.params = {...this.params, "kernel" : this.kernel};
        this.edited = false;
    }
}

@jsonObject
export class SobelXTransform extends SobelTransform {
    constructor() {
        super(true)
    }
}

@jsonObject
export class SobelYTransform extends SobelTransform {
    constructor() {
        super(false)
    }
}