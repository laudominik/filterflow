import { jsonObject } from "typedjson";
import MorphologicTransform from "../MorphologicTransform";


@jsonObject
export default class ErosionTransform extends MorphologicTransform {

    constructor(){
        super("Erosion", `bvec3 values = bvec3(false,false,false);`, `values.r = res.r > treshold || values.r;
        values.g = res.g > treshold || values.g;
        values.b = res.b > treshold || values.b;`);
    }
}