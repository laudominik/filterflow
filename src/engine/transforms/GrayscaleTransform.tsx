//@ts-nocheck
import "reflect-metadata"
import { jsonArrayMember, jsonMember, jsonObject } from "typedjson";
import PointTransform from "./PointTransform";

@jsonObject
export class GrayscaleTransform extends PointTransform {
    image?:string
    constructor() {
        super('Gray', false,    `
        precision mediump float;
        varying vec2 v_texCoord;
        uniform sampler2D u_image;

        uniform float u_arg;
        
        void main() {
            vec2 pixelCoords = v_texCoord ;
            vec3 col = texture2D(u_image, pixelCoords).rgb;
            float channel  = col.r * 0.299 + col.g * 0.587 + col.b * 0.114;

            gl_FragColor = vec4(channel, channel, channel, 1.0);
        }
        `)
        this.params = {...this.params, "argument" : 1};
    }
}
