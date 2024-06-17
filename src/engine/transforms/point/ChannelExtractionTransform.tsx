import { jsonObject } from "typedjson";
import PointTransform from "../PointTransform";

@jsonObject({name:"ChannelExtractionTransform"})
abstract class ChannelExtractionTransform extends PointTransform {
    constructor(name: string = "Channel extraction", extractionShader: string) {
        super(name, false,    `
        precision mediump float;
        varying vec2 v_texCoord;
        uniform sampler2D u_image;

        uniform float u_arg;
        
        void main() { 
            vec2 pixelCoords = v_texCoord ;
            vec3 col = texture2D(u_image, pixelCoords).rgb;
            ${extractionShader}
        }
        `)
        this.params = {...this.params, "argument" : 1};
    }

    public infoView(): string | null {
        return "extracts given channel from image"
    }
}
@jsonObject({name:"RChannelExtractionTransform"})
export class RChannelExtractionTransform extends ChannelExtractionTransform {
    constructor(){
        super("R channel", `
            gl_FragColor = vec4(col.x, 0.0, 0.0, 1.0);
        `)
    }
}

@jsonObject({name:"GChannelExtractionTransform"})
export class GChannelExtractionTransform extends ChannelExtractionTransform {
    constructor(){
        super("G channel", `
            gl_FragColor = vec4(0.0, col.y, 0.0, 1.0);
        `)
    }
}

@jsonObject({name:"BChannelExtractionTransform"})
export class BChannelExtractionTransform extends ChannelExtractionTransform {
    constructor(){
        super("B channel", `
            gl_FragColor = vec4(0.0, 0.0, col.z, 1.0);
        `)
    }
}