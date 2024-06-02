import KVHandlerIfc from "./kvhandler";

export default class LSHandler implements KVHandlerIfc {
    write(key: string, value: string) {
        localStorage.setItem(key, value)
    }
    read(key: string) {
        return localStorage.getItem(key)!
    }
    delete(key: string) {
        localStorage.removeItem(key);
    }
}