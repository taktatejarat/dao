// src/lib/polyfill.ts

"use client";

// جلوگیری از خطای ReferenceError: indexedDB is not defined در سمت سرور (SSR)
if (typeof window === 'undefined' && typeof global !== 'undefined') {
    
    // تعریف ساختار جعلی مینیمال برای indexedDB
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

    // ✅ فقط indexedDB را به گلوبال اضافه می‌کنیم
    // ❌ خطوط مربوط به تعریف global.window را حذف کردیم تا Wagmi گیج نشود
    // @ts-ignore
    global.indexedDB = mockIndexedDB;
}

export {};