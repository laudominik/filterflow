import "reflect-metadata"
import { jsonObject } from "typedjson";
import ConvolutionTransform from "../ConvolutionTransform";

@jsonObject
class LaplaceTransform extends ConvolutionTransform {

    image?:string
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
    }
}

@jsonObject
export class Conn4LaplaceTransform extends LaplaceTransform {
    public _update_node(): void {
        throw new Error("Method not implemented.");
    }
    constructor() {
        super(true)
    }
}

@jsonObject
export class Conn8LaplaceTransform extends LaplaceTransform {
    public _update_node(): void {
        throw new Error("Method not implemented.");
    }
    constructor() {
        super(false)
    }
}