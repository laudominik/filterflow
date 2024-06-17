import "reflect-metadata"
import { jsonObject } from "typedjson";
import PointTransform from "../PointTransform";

@jsonObject({name:"BitwiseTransform"})
export class BitwiseTransform extends PointTransform {
    constructor(name?: string, parametrized?: boolean, fragmentShader? : string) {
        super(name, parametrized, fragmentShader)
        this.color = "#E2F0F4";
    }
}
