export interface IWorker {
  tick: (signal?: AbortSignal) => Promise<number>;
  start: () => boolean;
  stop: () => boolean;
  isRunning: () => boolean;
}
