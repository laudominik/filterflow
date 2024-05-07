import KVHandlerIfc from "./kvhandler";

export default class OPFSHandler implements KVHandlerIfc {
    async write(key: string, value: string) {
        const root = await navigator.storage.getDirectory()
        const file = await root.getFileHandle(key, {
            create: true,
        })
        //@ts-ignore
        const wrt = await file.createWritable()
        await wrt.write(value)
        await wrt.close()
    }
    read(key: string) {
        return ""
    }
    delete(key: string) {
    }
}