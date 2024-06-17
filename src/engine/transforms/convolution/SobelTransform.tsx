

import { jsonObject } from "typedjson";
import ConvolutionTransform from "../ConvolutionTransform";

@jsonObject({name:"SobelTransform"})
 class SobelTransform extends ConvolutionTransform {
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

@jsonObject({name:"SobelXTransform"})
export class SobelXTransform extends SobelTransform {
    constructor() {
        super(true)
    }
}

@jsonObject({name:"SobelYTransform"})
export class SobelYTransform extends SobelTransform {
    constructor() {
        super(false)
    }
}