import { ReactElement, JSXElementConstructor } from "react";
import BinaryTransform from "../BinaryTransform"
import { jsonObject } from "typedjson";
import BitwiseVisualizationComponent from "../../../components/visualizations/BitwiseVisualizationComponent";

const fs = `
precision mediump float;
varying vec2 v_texCoord;
uniform sampler2D u_image0;
uniform sampler2D u_image1;

uniform float u_arg;

int XOR_8(int n1, int n2){

    float v1 = float(n1);
    float v2 = float(n2);
    
    int byteVal = 1;
    int result = 0;
    
    for(int i = 0; i < 8; i++){
        bool keepGoing = v1>0.0 || v2 > 0.0;
        if(keepGoing){
            bool addOn = mod(v1, 2.0) > 0.0 ^^ mod(v2, 2.0) > 0.0;
            
            if(addOn){
                result += byteVal;
            }
            
            v1 = floor(v1 / 2.0);
            v2 = floor(v2 / 2.0);
            
            byteVal *= 2;
        } else {
            return result;
        }
    }
    return result;	
}

void main() {
    vec2 pixelCoords = v_texCoord ;
    vec3 col0 = texture2D(u_image0, pixelCoords).rgb;
    vec3 col1 = texture2D(u_image1, pixelCoords).rgb;
    
    float x = float(XOR_8(int(floor(col0.x * 255.0)), int(floor(col1.x * 255.0))))/255.0;
    float y = float(XOR_8(int(floor(col0.y * 255.0)), int(floor(col1.y * 255.0))))/255.0;
    float z = float(XOR_8(int(floor(col0.z * 255.0)), int(floor(col1.z * 255.0))))/255.0;

    gl_FragColor = vec4(x,y,z, 1.0);
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

    visualizationView(guid: string): JSX.Element {
        return <BitwiseVisualizationComponent guid={guid} operantName="xor"/>
    }

    public infoView(): string | null {
        return "For each channel, performs bitwise: logical xor operation (color1 ^ color2)"
    }

}