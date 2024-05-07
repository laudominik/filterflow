
export type ImageId = string

/*
TODO: change to OPFS
*/
export namespace ImageStore {

    export async function add(imageString: string, storeName?: string, precalculatedHash?: string): Promise<ImageId> {
        let hash = 'img' + crypto.randomUUID()
        if (precalculatedHash) {
            hash = precalculatedHash;
        }
        localStorage.setItem(hash, imageString)
        setImageList([...getImageList(storeName), hash], storeName)
        return hash
    }

    async function saveOpfs(key: string, value: string) {

    }

    async function loadOpfs(key: string) {

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

    export async function remove(hash: ImageId, storeName?: string) {
        if (!storeName) {
            storeName = selectedName
        }

        const imageList = getImageList(storeName)
        setImageList(imageList.filter(el => el != hash), storeName)

        // check if it can be safely removed (i.e. if it is not used by anything else)
        if (!canRemoveImage(hash, storeName)) return
        localStorage.removeItem(hash)
    }

    export async function get(hash: ImageId): Promise<string | undefined> {
        return localStorage.getItem(hash) ?? undefined
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
}
