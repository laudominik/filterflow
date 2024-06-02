
export type ImageId = string

/*
note: OPFS support - chrome 86, edge 86, firefox 111, safari 15.2
*/
export namespace ImageStore {

    export async function add(imageString: string, storeName?: string, precalculatedHash?: string): Promise<ImageId> {
        let hash = 'img' + crypto.randomUUID()
        if (precalculatedHash) {
            hash = precalculatedHash;
        }
        if(await opfsAvailable()){
            await saveOpfs(hash, imageString)
        } else {
            warningNoOPFSSupport()
        }
        setImageList([...getImageList(storeName), hash], storeName)
        return hash
    }

    async function saveOpfs(key: string, value: string) {
        const root = await navigator.storage.getDirectory()
        const file = await root.getFileHandle(key, {
            create: true,
        })
        //@ts-ignore
        const wrt = await file.createWritable()

        await wrt.write(value)
        await wrt.close()
    }

    async function loadOpfs(key: string) {
        const root = await navigator.storage.getDirectory()
        const file = await root.getFileHandle(key)
        if (!file) {
            return undefined
        }

        const f = await file.getFile()
        return await f.text()
    }

    async function removeOpfs(key: string) {
        const root = await navigator.storage.getDirectory()
        await root.removeEntry(key)
    }

    async function opfsAvailable(){
        const root = await navigator.storage.getDirectory()
        const file = await root.getFileHandle("storage", {
            create: true,
        })
        //@ts-ignore
        return file.createWritable != undefined
    }

    function canRemoveImage(key: string, skipName: string) {
        const cache = localStorage.getItem("stores_list");
        if (!cache) return;
        const nbList = JSON.parse(cache);
        for (const name of nbList) {
            if (name == skipName) continue;
            if (getImageList(name).includes(key)) {
                return false;
            }
        }
        return true
    }

    function warningNoOPFSSupport(){
        console.warn(`[FilterFlow]
        Origin Private File System (OPFS) is not fully supported on that browser, 
        either use a browser that supports OPFS or use the app normally without refreshing (images will be lost on refresh)
    `)
    }

    export async function remove(hash: ImageId, storeName?: string) {
        if (!storeName) {
            storeName = selectedName
        }

        const imageList = getImageList(storeName)
        setImageList(imageList.filter(el => el != hash), storeName)

        // check if it can be safely removed (i.e. if it is not used by anything else)
        if (!canRemoveImage(hash, storeName)) return

        if(await opfsAvailable()){
            await removeOpfs(hash)
        } else {
            warningNoOPFSSupport()
        }
        //localStorage.removeItem(hash)
    }

    export async function get(hash: ImageId): Promise<string | undefined> {
        let result : string|undefined = undefined
        if(await opfsAvailable()){
            console.log('hash' + hash)
            result = await loadOpfs(hash)
           
        } else {
            warningNoOPFSSupport()
        }
        return result ?? undefined
    }

    const imageListName = "imageList"
    let selectedName = "";

    export function getImageList(name?: string): string[] {
        if (!name) {
            name = selectedName
        }
        const imageListStr = localStorage.getItem(imageListName + name)
        if (imageListStr == null) {
            return []
        }
        return JSON.parse(imageListStr) ?? []
    }

    export function setImageList(list: string[], name?: string) {
        if (!name) {
            name = selectedName
        }
        localStorage.setItem(imageListName + name, JSON.stringify(list))
    }

    export function setSelectedName(name: string) {
        selectedName = name
    }

    async function listAllOpfs() {
        const root = await navigator.storage.getDirectory()

        //@ts-ignore
        for await (let name of root.keys()) {
            console.debug("OPFS:" + name)
        }
    }

    async function cleanOpfs() {
        const root = await navigator.storage.getDirectory()

        //@ts-ignore
        for await (let name of root.keys()) {
            root.removeEntry(name)
        }
    }
}

