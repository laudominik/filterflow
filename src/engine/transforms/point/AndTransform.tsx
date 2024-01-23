
import "reflect-metadata"
import { jsonObject } from "typedjson";
import { BitwiseTransform } from "./BitwiseTransform";

@jsonObject
export class AndTransform extends BitwiseTransform {
    image?:string

    // AND = v1 * v2
    constructor() {
        super('AND', true,    `
        precision mediump float;
        varying vec2 v_texCoord;
        uniform sampler2D u_image;

        uniform float u_arg;
        
        void main() {
            vec2 pixelCoords = v_texCoord ;
            vec3 col = texture2D(u_image, pixelCoords).rgb;
            col.r = col.r * u_arg;
            col.g = col.g * u_arg;
            col.b = col.b * u_arg;

            gl_FragColor = vec4(col, 1.0);
        }
        `)
        this.params = {...this.params, "argument" : 1};
    }
}
