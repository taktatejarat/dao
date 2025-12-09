// src/lib/polyfill.ts

"use client";

if (typeof global !== 'undefined' && typeof window === 'undefined') {
    
    const mockIndexedDB = {
        open: () => ({
            onupgradeneeded: null,
            onsuccess: null,
            onerror: null,
            readyState: "done",
            result: {
                createObjectStore: () => ({
                    createIndex: () => {},
                    put: () => ({ onsuccess: null, onerror: null }),
                    get: () => ({ onsuccess: null, onerror: null }),
                    delete: () => ({ onsuccess: null, onerror: null }),
                    clear: () => ({ onsuccess: null, onerror: null }),
                    add: () => ({ onsuccess: null, onerror: null }),
                    count: () => ({ onsuccess: null, onerror: null }),
                    getAll: () => ({ onsuccess: null, onerror: null }),
                    getAllKeys: () => ({ onsuccess: null, onerror: null }),
                    index: () => ({}),
                } as any), 
                transaction: () => ({
                    objectStore: () => ({
                        put: () => ({ onsuccess: null, onerror: null }),
                        get: () => ({ onsuccess: null, onerror: null }),
                        delete: () => ({ onsuccess: null, onerror: null }),
                        clear: () => ({ onsuccess: null, onerror: null }),
                        getAll: () => ({ onsuccess: null, onerror: null }),
                    } as any),
                    oncomplete: null,
                    onerror: null,
                    abort: () => {},
                    commit: () => {},
                    db: {},
                    error: null,
                    mode: 'readonly',
                    objectStoreNames: [],
                } as any),
                close: () => {},
                objectStoreNames: { contains: () => false },
                name: 'mockDB',
                version: 1,
            } as any, 
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => false,
        }),
        deleteDatabase: () => ({
            onsuccess: null,
            onerror: null,
            addEventListener: () => {},
            removeEventListener: () => {},
        } as any),
        cmp: () => 0,
        databases: () => Promise.resolve([]),
    };

    // @ts-ignore
    global.indexedDB = mockIndexedDB;
    
    // @ts-ignore
    if (!global.window) {
        // @ts-ignore
        global.window = { indexedDB: mockIndexedDB };
    }
}

// برای مرورگرهایی که ممکن است در حالت Private دسترسی به indexedDB نداشته باشند
if (typeof window !== 'undefined' && !window.indexedDB) {
    // @ts-ignore
    window.indexedDB = {
        open: () => ({
            result: {
                createObjectStore: () => ({
                    transaction: () => ({ objectStore: () => ({}) })
                } as any)
            } as any,
            addEventListener: () => {}
        } as any)
    };
}

export {};