export interface RoomLock {
  // Runs task with mutual exclusion against any other task with the same key
  run<T>(key: string, task: () => Promise<T>): Promise<T>;
}
