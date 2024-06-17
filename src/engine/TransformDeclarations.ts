import TransformRegistry from "./TransformRegistry"

export const registry = new TransformRegistry()
           
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

export function getBinary(){
    return registry.getOfType("binary")!
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

export function transformType(){
    return registry.getTransformType();
}
