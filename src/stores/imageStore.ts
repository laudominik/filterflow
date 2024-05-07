
export type ImageId=string

/*
TODO: change to OPFS
*/
export namespace ImageStore {
    export async function add(imageString: string): Promise<ImageId> {
        const hash = 'img' + crypto.randomUUID()
        localStorage.setItem(hash, imageString)
        return hash
    }
    
    export async function remove(hash: ImageId){
        localStorage.removeItem(hash)
    }
    
    export async function get(hash: ImageId): Promise<string | undefined> {
        return localStorage.getItem(hash) ?? undefined
    }
}
