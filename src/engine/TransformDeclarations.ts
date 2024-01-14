import TransformRegistry from "./TransformRegistry"
import FilterTransform from "./transforms/FilterTransform"
import MaxPoolingTransform from "./transforms/MaxPoolingTransform"
import {SobelXTransform, SobelYTransform} from "./transforms/SobelTransform"
import {Conn4LaplaceTransform, Conn8LaplaceTransform} from "./transforms/LaplaceTransform"
import { BrightnessTransform } from "./transforms/BrightnessTransform"
import { ThresholdTransform } from "./transforms/ThresholdTransform"
import { GrayscaleTransform } from "./transforms/GrayscaleTransform"
import { FromYCbCrTransform, ToYCbCrTransform } from "./transforms/YCbCrTransform"
import { XorTransform } from "./transforms/XorTransform"
import { OrTransform } from "./transforms/OrTransform"
import { AndTransform } from "./transforms/AndTransform"

const registry = new TransformRegistry()
            .declareLinear("4-connected laplace", Conn4LaplaceTransform)
            .declareLinear("8-connected laplace", Conn8LaplaceTransform)
            .declareLinear("gaussian", FilterTransform)
            .declareLinear("sobel X", SobelXTransform)
            .declareLinear("sobel Y", SobelYTransform)
            .declareLinear("custom_kernel", FilterTransform)
            .declarePooling("max_pooling", MaxPoolingTransform)
            .declarePooling("min_pooling", MaxPoolingTransform)
            .declarePooling("avg_pooling", MaxPoolingTransform)
            .declarePooling("median_pooling", MaxPoolingTransform)
            .declareLogical("xor", XorTransform)
            .declareLogical("or", OrTransform)
            .declareLogical("and", AndTransform)
            .declarePoint("brightness", BrightnessTransform)
            .declarePoint("threshold", ThresholdTransform)
            .declarePoint("grayscale", GrayscaleTransform)
            .declarePoint("to YCbCr", ToYCbCrTransform)
            .declarePoint("from YCbCr", FromYCbCrTransform)
            .declareMorphologic("erosion", FilterTransform)
            .declareMorphologic("dilatation", FilterTransform)

export default function mapToTransform(name: string){
    return registry.build(name)
}

export function getLinear(){
    return registry.getOfType("linear")!
}

export function getPooling(){
    return registry.getOfType("pooling")!
}

export function getLogical(){
    return registry.getOfType("logical")!
}

export function getPoint(){
    return registry.getOfType("point")!
}

export function getMorphologic(){
    return registry.getOfType("morphologic")!
}

export function knownTypes(){
    return registry.getKnownTypes();
}

