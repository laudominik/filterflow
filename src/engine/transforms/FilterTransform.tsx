import Transform from "../Transform";

class FilterTransform extends Transform {
    constructor(name?: string) {
        super(name ?? 'Custom kernel', '#E6F4E2');
    }

    paramView() {
        // TODO: show the kernel size and kernel view
        /*
         *  tbd: how could we split the view logic here and keep it nice and tidy
         */
        return <div>placeholder - kernel</div>;
    }

    apply(id: number): number {
        // TODO: apply transformation
        return id;
    }

    updateParams(parameters: { [key: string]: any }): void {
        // TODO: update mask
        /*
         *  tbd: should we use builder pattern and rebuild the transformations
         *  or just update params
         */
    }
}

export default FilterTransform;