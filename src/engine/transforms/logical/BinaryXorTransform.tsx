import { ReactElement, JSXElementConstructor } from "react";
import BinaryTransform from "../BinaryTransform"
import { jsonObject } from "typedjson";

const fs = `
precision mediump float;
varying vec2 v_texCoord;
uniform sampler2D u_image0;
uniform sampler2D u_image1;

uniform float u_arg;

void main() {
    vec2 pixelCoords = v_texCoord ;
    vec3 col0 = texture2D(u_image0, pixelCoords).rgb;
    vec3 col1 = texture2D(u_image1, pixelCoords).rgb;
    
    vec3 col = vec3(0.0);
    col.x = col0.x * (1.0-col1.x) + col1.x * (1.0-col0.x);
    col.y = col0.y * (1.0-col1.y) + col1.y * (1.0-col0.y);
    col.z = col0.z * (1.0-col1.z) + col1.z * (1.0-col0.z);

    gl_FragColor = vec4(col.x, col.y, col.z, 1.0);
}
`

@jsonObject({name:"BinaryXorTransform"})
export default class BinaryXorTransform extends BinaryTransform {
    constructor(){
        super("binary xor", fs);
    }

    paramView(guid: string): ReactElement<any, string | JSXElementConstructor<any>> {
        return <>No params to specify</>
    }

}