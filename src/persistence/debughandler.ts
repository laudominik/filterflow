import KVHandlerIfc from "./kvhandler";
import LSHandler from "./lshandler";
import OPFSHandler from "./opfshandler";

/*
    debug class for writing both to opfs and ls
*/
export default class DebugHandler implements KVHandlerIfc {
    lsHandler: LSHandler
    opfsHandler: OPFSHandler
    readFromLS: boolean

    constructor(readFromLS: boolean) {
        this.lsHandler = new LSHandler()
        this.opfsHandler = new OPFSHandler()
        this.readFromLS = readFromLS
    }
    write(key: string, value: string): void {
        this.lsHandler.write(key, value)
        this.opfsHandler.write(key, value)
    }
    read(key: string) {
        if (this.readFromLS) {
            return this.lsHandler.read(key)
        }
        return this.opfsHandler.read(key)
    }
    delete(key: string) {
        this.lsHandler.delete(key)
        this.opfsHandler.delete(key)
    }
}