export interface Scheduler {
  // Replaces the task if the key already exists; `at` is epoch ms
  schedule(key: string, at: number, task: () => Promise<void>): void;
  cancel(key: string): void;
}
