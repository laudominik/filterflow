
import "reflect-metadata"
import { jsonObject } from "typedjson";
import { BitwiseTransform } from "./BitwiseTransform";

@jsonObject({name:"AndTransform"})
export class AndTransform extends BitwiseTransform {

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
            float n_arg = u_arg / 255.0;
            col.r = col.r * n_arg;
            col.g = col.g * n_arg;
            col.b = col.b * n_arg;

            gl_FragColor = vec4(col, 1.0);
        }
        `)
        this.params = {...this.params, "argument" : 1};
    }

    public infoView(): string | null {
        return "for each channel performs the following operation: pixel_value * argument"
    }
}
