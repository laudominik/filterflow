import "reflect-metadata"
import { jsonObject } from "typedjson";
import Transform from "../../Transform";
import { GUID } from "../../iengine";
import TernaryTransform from "../TernaryTransform";
import { ReactElement } from "react";

const vs = `
attribute vec2 a_position;
varying vec2 v_texCoord;

void main() {
    gl_Position = vec4(a_position, 0, 1);
    v_texCoord = vec2((a_position.x + 1.0) / 2.0, 1.0 - (a_position.y + 1.0) / 2.0);
}
`;

const fs = `
precision mediump float;
varying vec2 v_texCoord;
uniform sampler2D u_image0;
uniform sampler2D u_image1;
uniform sampler2D u_image2;

uniform float u_arg;

void main() {
    vec2 pixelCoords = v_texCoord ;
    vec3 col0 = texture2D(u_image0, pixelCoords).rgb;
    vec3 col1 = texture2D(u_image1, pixelCoords).rgb;
    vec3 col2 = texture2D(u_image2, pixelCoords).rgb;

    gl_FragColor = vec4(col0.x, col1.y, col2.z, 1.0);
}
`

@jsonObject
class ChannelCombinationTransform extends TernaryTransform {
    constructor() {
        super("Channel combination", fs);
    }

    paramView(guid: string): ReactElement {
        return <>no parameters to specify</>
    }

}

export default ChannelCombinationTransform;