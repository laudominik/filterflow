import { jsonObject } from "typedjson";
import MorphologicTransform from "../MorphologicTransform";


@jsonObject
export default class DilatationTransform extends MorphologicTransform {

    constructor(){
        super("Dilatation",`bvec3 values = bvec3(true, true, true);`, 
        `values.r = res.r > treshold && values.r;
        values.g = res.g > treshold && values.g;
        values.b = res.b > treshold && values.b;`);
    }
}