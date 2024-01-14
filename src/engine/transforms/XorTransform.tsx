//@ts-nocheck
import "reflect-metadata"
import { jsonArrayMember, jsonMember, jsonObject } from "typedjson";
import PointTransform from "./PointTransform";
import { BitwiseTransform } from "./BitwiseTransform";

@jsonObject
export class XorTransform extends BitwiseTransform {
    image?:string

    // XOR = v1*(1-v2) +v2*(1-v1)
    constructor() {
        super('XOR', true,    `
        precision mediump float;
        varying vec2 v_texCoord;
        uniform sampler2D u_image;

        uniform float u_arg;
        
        void main() {
            vec2 pixelCoords = v_texCoord ;
            vec3 col = texture2D(u_image, pixelCoords).rgb;
            col.r = col.r * (1.0-u_arg) + u_arg * (1.0-col.r);
            col.g = col.g * (1.0-u_arg) + u_arg * (1.0-col.g);
            col.b = col.b * (1.0-u_arg) + u_arg * (1.0-col.b);

            gl_FragColor = vec4(col, 1.0);
        }
        `)
        this.params = {...this.params, "argument" : 1};
    }
}
