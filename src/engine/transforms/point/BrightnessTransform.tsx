

import { jsonObject } from "typedjson";
import PointTransform from "../PointTransform";

@jsonObject({name:"BrightnessTransform"})
export class BrightnessTransform extends PointTransform {
    constructor() {
        super('Brightness', true,    `
        precision mediump float;
        varying vec2 v_texCoord;
        uniform sampler2D u_image;

        uniform float u_arg;
        
        void main() {
            vec2 pixelCoords = v_texCoord ;
            vec3 col = texture2D(u_image, pixelCoords).rgb;
            gl_FragColor = vec4(col * u_arg, 1.0);
        }
        `)
        this.params = {...this.params, "argument" : 1};
    }
}
