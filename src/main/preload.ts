import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { Channels } from '../constants';

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    removeListener(channel: Channels, listener: (...args: any[]) => void) {
      ipcRenderer.removeListener(channel, listener);
    },
    removeAllListeners(channel: Channels) {
      ipcRenderer.removeAllListeners(channel);
    },
    sendMessage(channel: Channels, args: unknown[]) {
      ipcRenderer.send(channel, args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => ipcRenderer.removeListener(channel, subscription);
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
    async invoke(channel: Channels, args: unknown[]) {
      const result = await ipcRenderer.invoke(channel, args);
      return result;
    },
  },
});
