import KVHandlerIfc from "./kvhandler";

export default class OPFSHandler implements KVHandlerIfc {

    fileHandle?: FileSystemFileHandle

    constructor() {
        this.constructorAsync()
    }

    async constructorAsync() {
        const opfsRoot = await navigator.storage.getDirectory();
        this.fileHandle = await opfsRoot.getFileHandle("storage", {create: true});
    }

    write(key: string, value: string) {

        // const root = await navigator.storage.getDirectory()
        // const file = await root.getFileHandle(key, {
        //     create: true,
        // })
        // //@ts-ignore
        // const wrt = await file.createWritable()

        // await wrt.write(value)
        // await wrt.close()
    }
    read(key: string) {
        return ""
    }
    delete(key: string) {
    }
}