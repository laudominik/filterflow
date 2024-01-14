//@ts-nocheck
import "reflect-metadata"
import { jsonArrayMember, jsonMember, jsonObject } from "typedjson";
import KernelComponent from "../../components/transforms/KernelComponent";
import FilterTransform from "./FilterTransform";
import Transform from "../Transform";

@jsonObject
class LaplaceTransform extends FilterTransform {
    image?:string
    constructor(conn8: boolean) {
        
        let fragment = `
        precision mediump float;
        varying vec2 v_texCoord;
        uniform sampler2D u_image;

        uniform float u_arg;
        
        void main() {
            vec2 pixelCoords = v_texCoord ;
            vec3 col = texture2D(u_image, pixelCoords).rgb;
            gl_FragColor = vec4(col * u_arg, 1.0);
        }
        `
        super('Laplace', fragment);
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
    constructor() {
        super(true)
    }
}

@jsonObject
export class Conn8LaplaceTransform extends LaplaceTransform {
    constructor() {
        super(false)
    }
}