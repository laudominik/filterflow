import 'reflect-metadata'
import {jsonObject, jsonMember} from 'typedjson';
import SourceTransform from '../SourceTransform';
import PredefinedSourceTransform from '../PredefinedSourceTransform';


@jsonObject
export default class WhiteNoiseTransform extends PredefinedSourceTransform {
    @jsonMember(Number)
    seed: Number

    created: boolean

    constructor() {
        let seed = Math.random()

        super("White noise", seed, `
        precision mediump float;
        varying vec2 v_texCoord;
        uniform float u_arg;
        
        float rng(vec2 co){
            return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453 * u_arg);
        }

        void main() {

            float random = rng(v_texCoord);
            gl_FragColor = vec4(vec3(random, random, random), 1.0);
        }
    `);
        // this.seed = 0
        this.seed = seed
        this.created = false;
    }
}