
import "reflect-metadata"
import { jsonObject } from "typedjson";
import PointTransform from "../PointTransform";
import { GUID } from "../../engine";
import TresholdVisualizationComponent from "../../../components/visualizations/TresholdVisualizationComponent";

@jsonObject({name:"ThresholdTransform"})
export class ThresholdTransform extends PointTransform {
    constructor() {
        super('Threshold', true,    `
        precision mediump float;
        varying vec2 v_texCoord;
        uniform sampler2D u_image;

        uniform float u_arg;
        
        void main() {
            vec2 pixelCoords = v_texCoord ;
            vec3 col = texture2D(u_image, pixelCoords).rgb;

            if(col.x * 255.0 > u_arg){
                col.x = 1.0;
            } else {
                col.x = 0.0;
            }

            if(col.y * 255.0> u_arg){
                col.y = 1.0;
            } else {
                col.y = 0.0;
            }

            if(col.z * 255.0 > u_arg){
                col.z = 1.0;
            } else {
                col.z = 0.0;
            }

            gl_FragColor = vec4(col, 1.0);
        }
        `)
        this.params = {...this.params, "argument" : 1};
    }

    visualizationView(guid: GUID) {
        return <TresholdVisualizationComponent guid={guid} />
    }
}
