import { Channels } from '../types';

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        openExternal(url: string): void;
        eventNames(): string[];
        removeListener<T>(
          channel: Channels,
          listener: (...args: T[]) => void
        ): void;
        removeAllListeners(channel: Channels): void;
        sendMessage<T>(channel: Channels, args: T[]): void;
        on<T>(
          channel: Channels,
          func: (...args: T[]) => void
        ): (() => void) | undefined;
        once<T>(channel: Channels, func: (...args: T[]) => void): void;
        invoke<T, Y>(channel: Channels, args: T[]): Promise<Y>;
      };
    };
  }
}

export {};
