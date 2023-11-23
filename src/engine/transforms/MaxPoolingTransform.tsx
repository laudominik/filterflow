import Transform from "../Transform";

class MaxPoolingTransform extends Transform {
    getImageString(): string {
        throw new Error("Method not implemented.");
    }
    constructor() {
        super('Max pooling', '#E2E7F4');
    }

    paramView() {
        // TODO: show the kernel size and kernel view
        /*
         *  tbd: how could we split the view logic here and keep it nice and tidy
         */
        return <div>max pool</div>
    }

    apply(from:string): string {
        // TODO: apply transformation
        // return id;
        return from;
    }

    updateParams(parameters: { [key: string]: any }): void {
        // TODO: update mask
        /*
         *  tbd: should we use builder pattern and rebuild the transformations
         *  or just update params
         */
    }
}

export default MaxPoolingTransform;