import type { Readable, Writable } from 'svelte/store'
import { get } from 'svelte/store'

export interface ReadableArrayStore<T> {
    at(index: number): T | undefined
    includes(value: T | undefined): boolean
    find(predicate: (item: T) => unknown): T | undefined
    findIndex(predicate: (item: T) => unknown): number
    filter(predicate: (item: T) => unknown): T[]
}

export interface WritableArrayStore<T> {
    delete(value: T | undefined): void
    add(value: T | undefined): void
}

export function arrayify<T>(store: Writable<T[]>): Writable<T[]> & ReadableArrayStore<T> & WritableArrayStore<T>;
export function arrayify<T>(store: Readable<T[]>): Readable<T[]> & ReadableArrayStore<T>;
export function arrayify<T>(store: Readable<T[]>) {
    store['at'] = (index: number): T | undefined => get(store).at(index)
    store['find'] = (predicate: (item: T) => unknown): T | undefined => get(store).find(predicate)
    store['findIndex'] = (predicate: (item: T) => unknown): number => get(store).findIndex(predicate)
    store['filter'] = (predicate: (item: T) => unknown): T[] => get(store).filter(predicate)
    store['includes'] = (value: T | undefined): boolean => get(store).includes(value)
    if ('update' in store && typeof store.update == 'function') {
        ((writableStore)=>{
            writableStore['delete'] = (value: T | undefined): void => {
                if (value !== undefined && get(writableStore).includes(value)) {
                    writableStore.update(arr => {
                        arr.splice(arr.indexOf(value), 1)
                        return arr
                    })
                }
            }
            writableStore['add'] = (value: T | undefined): void => {
                if (value !== undefined && ! get(writableStore).includes(value)) {
                    writableStore.update(arr => {
                        arr.push(value)
                        return arr
                    })
                }
            }
        })(store as Writable<T[]>)
    }
    return store
}
