//@ts-nocheck
import "reflect-metadata"
import { jsonArrayMember, jsonMember, jsonObject } from "typedjson";
import PointTransform from "./PointTransform";

@jsonObject
export class ToYCbCrTransform extends PointTransform {
    image?:string
    constructor() {
        super('To YCbCr', false,    `
        precision mediump float;
        varying vec2 v_texCoord;
        uniform sampler2D u_image;

        uniform float u_arg;
        
        void main() {
            vec2 pixelCoords = v_texCoord ;
            vec3 col = texture2D(u_image, pixelCoords).rgb;
            float Y  = col.r * 0.299 + col.g * 0.587 + col.b * 0.114;
            float Cb = col.r * - 0.169 + col.g * -0.331 + col.b * 0.5 + 0.5;
            float Cr = col.r * 0.5 + col.g * -0.419 + col.b * -0.081 + 0.5; 

            gl_FragColor = vec4(Y, Cb, Cr, 1.0);
        }
        `)
        this.params = {...this.params, "argument" : 1};
    }
}

@jsonObject
export class FromYCbCrTransform extends PointTransform {
    image?:string
    constructor() {
        super('From YCbCr', false,    `
        precision mediump float;
        varying vec2 v_texCoord;
        uniform sampler2D u_image;

        uniform float u_arg;
        
        void main() {
            vec2 pixelCoords = v_texCoord ;
            vec3 col = texture2D(u_image, pixelCoords).rgb;
            float Y = col.r;
            float Cbmh = col.g - 0.5;
            float Crmh = col.b - 0.5;

            float R  = Y + 1.4 * Crmh;
            float G = Y - 0.343 * Cbmh - 0.711 * Crmh;
            float B = Y + 1.765 * Cbmh; 

            gl_FragColor = vec4(R, G, B, 1.0);
        }
        `)
        this.params = {...this.params, "argument" : 1};
    }
}
