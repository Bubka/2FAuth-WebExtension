import type { StorageLikeAsync } from '@vueuse/core'
import { storage } from 'webextension-polyfill'

export class webextStorageAsync implements StorageLikeAsync {

    async getItem(key: string): Promise<string | null> {
        return storage.local.get(key).then((result) => {
            return result[key]
        });
    }

    async setItem(key: string, value: string): Promise<void> {
        return storage.local.set({
            [key]: value,
        })
    }

    async removeItem(key: string): Promise<void> {
        return storage.local.remove(key)
    }
}