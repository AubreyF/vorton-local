export type LoadProgress = {
  phase: "waiting" | "downloading" | "checking" | "preparing";
  loaded: number;
  total?: number;
};
export type ProgressListener = (progress: LoadProgress) => void;
export type TrackedLoad<T> = {
  promise: Promise<T>;
  subscribe: (listener: ProgressListener) => () => void;
};

/** Subscribers share the download and receive its current state when joining late. */
export function trackLoad<T>(
  run: (report: ProgressListener) => Promise<T>,
): TrackedLoad<T> {
  let current: LoadProgress = { phase: "waiting", loaded: 0 };
  const listeners = new Set<ProgressListener>();
  const report: ProgressListener = (progress) => {
    current = progress;
    for (const listener of listeners) listener(progress);
  };
  const promise = Promise.resolve().then(() => run(report));
  void promise.then(
    () => listeners.clear(),
    () => listeners.clear(),
  );
  return {
    promise,
    subscribe(listener) {
      listeners.add(listener);
      listener(current);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export async function observeLoad<T>(
  task: TrackedLoad<T>,
  listener?: ProgressListener,
): Promise<T> {
  const unsubscribe = listener ? task.subscribe(listener) : undefined;
  try {
    return await task.promise;
  } finally {
    unsubscribe?.();
  }
}

/** Fetch streams expose decoded bytes. Use snapshot sizes, never compressed Content-Length. */
export async function readResponseBytes(
  response: Response,
  options: {
    total?: number;
    maximum: number;
    report?: ProgressListener;
  },
): Promise<Uint8Array> {
  const { total, maximum, report } = options;
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Empty dashboard response");
  let loaded = 0;
  let lastReport = 0;
  const chunks: Uint8Array[] = [];
  report?.({ phase: "downloading", loaded, total });
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      loaded += value.byteLength;
      if (loaded > (total ?? maximum) || loaded > maximum)
        throw new Error("Dashboard data exceeds its declared size");
      chunks.push(value);
      // Bound React updates on fast connections without hiding the final chunk.
      if (Date.now() - lastReport >= 100 || loaded === total) {
        report?.({ phase: "downloading", loaded, total });
        lastReport = Date.now();
      }
    }
  } finally {
    await reader.cancel();
  }
  if (total !== undefined && loaded !== total)
    throw new Error("Dashboard data size mismatch");
  const bytes = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  report?.({ phase: "checking", loaded, total });
  return bytes;
}
