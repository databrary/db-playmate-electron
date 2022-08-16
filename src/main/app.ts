/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { Asset } from 'types';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import {
  getCookies,
  getVolumeInfo,
  downloadAssetPromise,
  login,
  isLoggedIn,
} from '../services/databrary-service';

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let appWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const onAssetDownloadStarted = (asset: Asset) => {
  if (!appWindow) return;

  appWindow.webContents.send('assetDownloadStarted', asset);
};

const onAssetDownloadProgress = (asset: Asset) => {
  if (!appWindow) return;

  appWindow.webContents.send('assetDownloadProgress', asset);
};

const onAssetDowmloadDone = (asset: Asset) => {
  if (!appWindow) return;

  appWindow.webContents.send('assetDownloadDone', asset);
};

const onAssetDowmloadError = (asset: Asset, error: unknown) => {
  if (!appWindow) return;

  appWindow.webContents.send('assetDownloadError', {
    error,
  });
};

ipcMain.handle('downloadAssets', async (event, args: Asset[]) => {
  if (!getCookies() || !appWindow)
    throw Error('You must be logged into Databrary');

  const { filePaths, canceled } = await dialog.showOpenDialog(appWindow, {
    properties: ['openDirectory'],
  });

  if (canceled || !filePaths.length) return;

  const promiseList = [];
  for (const asset of args) {
    const localFilePath = path.resolve(
      filePaths[0],
      `${asset.assetName || asset.assetId}.mp4`
    );

    promiseList.push(
      downloadAssetPromise(
        asset,
        localFilePath,
        onAssetDownloadStarted,
        onAssetDownloadProgress,
        onAssetDowmloadDone,
        onAssetDowmloadError
      )
    );
  }

  Promise.all(promiseList).catch((error) => {
    console.error('An error occured while download Assets', error);
  });
});

ipcMain.handle('volumeInfo', async (event, args) => {
  if (!getCookies()) throw Error('You must be logged into Databrary');

  const volumeId = args[0];
  if (!volumeId) throw Error('You need a valid volume id');

  try {
    const volumeInfo = await getVolumeInfo(volumeId);
    return volumeInfo;
  } catch (error) {
    throw Error(`Volume ${volumeId} - ${error.message}`);
  }
});

ipcMain.handle('databraryLogin', async (event, args) => {
  const { email, password } = args[0];
  try {
    await login(email, password);

    if (appWindow) appWindow.loadURL(resolveHtmlPath('/'));
    return;
  } catch (error) {
    throw Error(`Cannot login to Databrary - ${error.message}`);
  }
});

ipcMain.handle('isDatabraryConnected', async (event, args) => {
  return isLoggedIn();
});

export const createAppWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  appWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      webSecurity: false,
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  appWindow.loadURL(resolveHtmlPath('index.html'));

  appWindow.on('ready-to-show', () => {
    if (!appWindow) {
      throw new Error('"appWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      appWindow.minimize();
    } else {
      appWindow.show();
    }
  });

  appWindow.on('closed', () => {
    appWindow = null;
  });

  const menuBuilder = new MenuBuilder(appWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  appWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};
