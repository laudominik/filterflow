import TransformRegistry from "./TransformRegistry"
import FilterTransform from "./transforms/FilterTransform"
import MaxPoolingTransform from "./transforms/MaxPoolingTransform"

const registry = new TransformRegistry()
            .declareLinear("laplace", FilterTransform)
            .declareLinear("gaussian", FilterTransform)
            .declareLinear("sobel", FilterTransform)
            .declareLinear("custom_kernel", FilterTransform)
            .declarePooling("max_pooling", MaxPoolingTransform)
            .declarePooling("min_pooling", MaxPoolingTransform)
            .declarePooling("avg_pooling", MaxPoolingTransform)
            .declarePooling("median_pooling", MaxPoolingTransform)
            .declareLogical("xor", MaxPoolingTransform)
            .declareLogical("or", MaxPoolingTransform)
            .declareLogical("and", MaxPoolingTransform)
            .declarePoint("brightness", MaxPoolingTransform)
            .declarePoint("threshold", MaxPoolingTransform)
            .declarePoint("grayscale", MaxPoolingTransform)
            .declarePoint("ycbcr", MaxPoolingTransform)
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

