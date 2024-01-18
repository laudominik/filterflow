import "reflect-metadata"
import { jsonObject } from "typedjson";
import ConvolutionTransform from "../ConvolutionTransform";

@jsonObject
class LaplaceTransform extends ConvolutionTransform {

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