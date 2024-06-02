export default interface KVHandlerIfc {
    write(key: string, value: string): void
    read(key: string): string | null
    delete(key: string): void
}