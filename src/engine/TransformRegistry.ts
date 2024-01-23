import Transform from "./Transform"
import SourceTransform from "./transforms/SourceTransform"


class TransformBuilder {
    constructor(private type: new ()=>Transform){}
    build(){
        return new this.type()
    }
}

export default class TransformRegistry {
    private registry: Map<string, TransformBuilder>
    private transformType: Map<string, string[]>
    private knownTypes: Set<new ()=> Transform>

    constructor(){
        this.registry = new Map()
        this.registry.set("source", new TransformBuilder(SourceTransform))
        this.knownTypes = new Set();
        this.knownTypes.add(SourceTransform)
        this.transformType = new Map([
            ["linear", []],
            ["pooling", []],
            ["logical", []],
            ["point", []],
            ["morphologic", []]
        ])
    }

    private declare(type: string, name: string, transform: new ()=>Transform): TransformRegistry {
        this.registry.set(name, new TransformBuilder(transform))
        this.knownTypes.add(transform)
        this.transformType.get(type)?.push(name)
        return this;
    }

    getKnownTypes(){
        return this.knownTypes;
    }

    getOfType(type: string): string[] | undefined {
        return this.transformType.get(type)
    }

    declareLinear(name: string, transform: new ()=>Transform) {
        return this.declare("linear", name, transform)
    }

    declarePooling(name: string, transform: new ()=>Transform) {
        return this.declare("pooling", name, transform)
    }

    declareLogical(name: string, transform: new ()=>Transform) {
        return this.declare("logical", name, transform)
    }

    declarePoint(name: string, transform: new ()=>Transform) {
        return this.declare("point", name, transform)
    }

    declareMorphologic(name: string, transform: new ()=>Transform) {
        return this.declare("morphologic", name, transform)
    }

    build(name: string){
        return this.registry.get(name)?.build()
    }

}

