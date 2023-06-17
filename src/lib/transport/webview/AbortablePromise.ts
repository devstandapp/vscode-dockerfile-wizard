// Taken from here: https://github.com/zzdjk6/simple-abortable-promise

export interface Abortable {
    abort: (reason?: string) => void;
    readonly abortReason?: string;
}

interface ExecutorFunction<T> {
    (resolve: (value?: PromiseLike<T> | T) => void, reject: (reason?: any) => void): void;
}

interface AbortableExecutorFunction<T> {
    (resolve: (value?: PromiseLike<T> | T) => void, reject: (reason?: any) => void, abortSignal: AbortSignal): void;
}

export class AbortablePromise<T> extends Promise<T> implements Abortable {
    public abort: Abortable['abort'];
    public get abortReason(): string | undefined {
        return this._abortReason;
    }

    private _abortReason?: string;

    constructor(executor: AbortableExecutorFunction<T>) {
        const abortController = new AbortController();
        const abortSignal = abortController.signal;

        const normalExecutor: ExecutorFunction<T> = (resolve, reject) => {
            abortSignal.addEventListener('abort', () => {
                reject(new AbortError(this.abortReason));
            });

            executor(resolve, reject, abortSignal);
        };

        super(normalExecutor);
        this.abort = (reason) => {
            this._abortReason = reason ? reason : 'Aborted';
            abortController.abort();
        };
    }

    static from = <T>(promise: Promise<T>): AbortablePromise<T> => {
        // If promise is already an AbortablePromise, return it directly
        if (promise instanceof AbortablePromise) {
            return promise;
        }

        return new AbortablePromise<T>((resolve, reject) => {
            promise.then(resolve).catch(reject);
        });
    };
}

export class AbortError extends Error {
    constructor(message: string = 'Aborted') {
        super(message);
        this.name = 'AbortError';
    }
}
