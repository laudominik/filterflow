import Transform from "./Transform"
import SourceTransform from "./transforms/SourceTransform"


class TransformBuilder {
    constructor(private type: new () => Transform) {}
    build() {
        return new this.type()
    }
}

export default class TransformRegistry {
    private registry: Map<string, TransformBuilder>
    private transformType: Map<string, string[]>
    private knownTypes: Set<new () => Transform>

    constructor() {
        this.registry = new Map()
        this.knownTypes = new Set();
        // TODO: better name; either for knownTypes or transformType (knownType referst to concrete transformations, transformType reffers to collections)
        this.knownTypes.add(SourceTransform)
        this.transformType = new Map([
            ["source", []],
            ["linear", []],
            ["pooling", []],
            ["logical", []],
            ["binary", []],
            ["point", []],
            ["morphologic", []],
            ["other", []]
        ])
        this.declare("source", "source", SourceTransform)
    }

    private declare(type: string, name: string, transform: new () => Transform): TransformRegistry {
        this.registry.set(name, new TransformBuilder(transform))
        this.knownTypes.add(transform)
        this.transformType.get(type)?.push(name)
        return this;
    }

    getKnownTypes() {
        return this.knownTypes;
    }

    getTransformType() {
        return this.transformType;
    }

    getOfType(type: string): string[] | undefined {
        return this.transformType.get(type)
    }

    declareSource(name: string, transform: new () => Transform) {
        return this.declare("source", name, transform)
    }

    declareLinear(name: string, transform: new () => Transform) {
        return this.declare("linear", name, transform)
    }

    declarePooling(name: string, transform: new () => Transform) {
        return this.declare("pooling", name, transform)
    }

    declareLogical(name: string, transform: new () => Transform) {
        return this.declare("logical", name, transform)
    }

    declareBinary(name: string, transform: new () => Transform) {
        return this.declare("binary", name, transform)
    }

    declarePoint(name: string, transform: new () => Transform) {
        return this.declare("point", name, transform)
    }

    declareMorphologic(name: string, transform: new () => Transform) {
        return this.declare("morphologic", name, transform)
    }

    declareOther(name: string, transform: new () => Transform) {
        return this.declare("other", name, transform);
    }

    build(name: string) {
        return this.registry.get(name)?.build()
    }

}

