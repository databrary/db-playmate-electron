import { Channels } from '../constants';

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        removeListener(
          channel: Channels,
          listener: (...args: any[]) => void
        ): void;
        removeAllListeners(channel: Channels): void;
        sendMessage(channel: Channels, args: unknown[]): void;
        on(
          channel: Channels,
          func: (...args: unknown[]) => void
        ): (() => void) | undefined;
        once(channel: Channels, func: (...args: unknown[]) => void): void;
        invoke<T>(channel: Channels, args: unknown[]): Promise<T>;
      };
    };
  }
}

export {};
