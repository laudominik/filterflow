//@ts-nocheck
import "reflect-metadata"
import { jsonArrayMember, jsonMember, jsonObject } from "typedjson";
import PointTransform from "./PointTransform";

@jsonObject
export class BitwiseTransform extends PointTransform {
    image?:string
    constructor(name?: string, parametrized?: boolean, fragmentShader? : string) {
        super(name, parametrized, fragmentShader)
        this.color = "#E2F0F4";
    }
}
