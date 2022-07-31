import { Channels } from 'main/preload';
import { IVolumeInfo } from '../interfaces';

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        sendMessage(channel: Channels, args: unknown[]): void;
        on(
          channel: string,
          func: (...args: unknown[]) => void
        ): (() => void) | undefined;
        once(channel: string, func: (...args: unknown[]) => void): void;
        invoke<T>(channel: Channels, args: any[]): Promise<T>;
      };
    };
  }
}

export {};
