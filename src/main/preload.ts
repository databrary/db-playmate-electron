import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { Channels } from '../constants';

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    eventNames() {
      return ipcRenderer.eventNames();
    },
    removeListener(channel: Channels, listener: (...args: any[]) => void) {
      ipcRenderer.removeListener(channel, listener);
    },
    removeAllListeners(channel: Channels) {
      ipcRenderer.removeAllListeners(channel);
    },
    sendMessage<T>(channel: Channels, args: T[]) {
      ipcRenderer.send(channel, args);
    },
    on<T>(channel: Channels, func: (...args: T[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: T[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => ipcRenderer.removeListener(channel, subscription);
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
    async invoke<T>(channel: Channels, args: T[]) {
      const result = await ipcRenderer.invoke(channel, args);
      return result;
    },
  },
});
