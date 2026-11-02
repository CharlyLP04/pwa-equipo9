export interface PrivateStorage {
  readonly length: number;
  key(index: number): string | null;
  removeItem(key: string): void;
}
export interface PrivateCaches {
  keys(): Promise<string[]>;
  delete(key: string): Promise<boolean>;
}
export interface CleanupOptions {
  indexedDB?: Pick<IDBFactory, "deleteDatabase">;
  storage?: PrivateStorage;
  sessionStorage?: PrivateStorage;
  cacheStorage?: PrivateCaches;
  queue?: {
    clear(): void;
  };
}
export async function clearPrivateSessionStorage(
  options: CleanupOptions,
): Promise<{
  removed: number;
}> {
  let removed = 0;
  const failures: string[] = [];
  for (const storage of [options.storage, options.sessionStorage]) {
    if (!storage) continue;
    try {
      const keys = Array.from({ length: storage.length }, (_, i) =>
        storage.key(i),
      ).filter((k): k is string => Boolean(k?.startsWith("utt-")));
      for (const key of keys) {
        try {
          storage.removeItem(key);
          removed++;
        } catch {
          failures.push("almacenamiento");
        }
      }
    } catch {
      failures.push("almacenamiento");
    }
  }
  try {
    options.queue?.clear();
  } catch {
    failures.push("cola");
  }
  if (options.cacheStorage) {
    try {
      for (const key of await options.cacheStorage.keys())
        if (key.startsWith("utt-lab-")) {
          try {
            if (!(await options.cacheStorage.delete(key)))
              failures.push("caché");
            else removed++;
          } catch {
            failures.push("caché");
          }
        }
    } catch {
      failures.push("caché");
    }
  }
  if (options.indexedDB) {
    try {
      await new Promise<void>((resolve, reject) => {
        const request = options.indexedDB!.deleteDatabase("pwa_offline_db");
        const timer = setTimeout(
          () => reject(new Error("Tiempo de borrado agotado")),
          5000,
        );
        request.onsuccess = () => {
          clearTimeout(timer);
          resolve();
        };
        request.onerror = () => {
          clearTimeout(timer);
          reject(new Error("Borrado fallido"));
        };
        request.onblocked = () => {
          clearTimeout(timer);
          reject(new Error("Base abierta en otra pestaña"));
        };
      });
      removed++;
    } catch {
      failures.push("IndexedDB");
    }
  }
  if (failures.length)
    throw new Error(
      "Limpieza incompleta: " + Array.from(new Set(failures)).join(", "),
    );
  return { removed };
}
export async function logoutSession(options: CleanupOptions): Promise<{
  removed: number;
}> {
  return clearPrivateSessionStorage(options);
}
