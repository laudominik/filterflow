
import { jsonObject } from "typedjson";
import ConvolutionTransform from "../ConvolutionTransform";

@jsonObject({name:"LaplaceTransform"})
class LaplaceTransform extends ConvolutionTransform {

    constructor(conn8: boolean) {

        super('Laplace');
        this.kernel = conn8 ? 
        [[1,     1,  1   ],
         [1,    -8,  1   ],
         [1,     1,  1   ]] :
        [[0,    1,  0  ],
         [1,    -4,  1   ],
         [0,    1,  0   ]] 

        this.params = {...this.params, "kernel" : this.kernel};
        this.edited = false;
    }
}

@jsonObject({name:"Conn4LaplaceTransform"})
export class Conn4LaplaceTransform extends LaplaceTransform {

    constructor() {
        super(true)
    }
}

@jsonObject({name:"Conn8LaplaceTransform"})
export class Conn8LaplaceTransform extends LaplaceTransform {

    constructor() {
        super(false)
    }
}