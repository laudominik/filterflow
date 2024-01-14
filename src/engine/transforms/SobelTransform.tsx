//@ts-nocheck
import "reflect-metadata"
import { jsonArrayMember, jsonMember, jsonObject } from "typedjson";
import KernelComponent from "../../components/transforms/KernelComponent";
import FilterTransform from "./FilterTransform";
import Transform from "../Transform";

@jsonObject
class SobelTransform extends FilterTransform {
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