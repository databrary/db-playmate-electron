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
import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  dialog,
  OpenDialogOptions,
} from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { statSync } from 'fs';
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
import {
  downloadFilePromise,
  uploadChunkFile,
  uploadFile,
} from '../services/box-service';
import { insertCell } from '../services/datavyu-service';
import { BOX_MAP, Channels } from '../constants';

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

const showOpenDialog = async (
  options: OpenDialogOptions = { properties: ['openDirectory'] }
): Promise<string[]> => {
  if (!appWindow) throw new Error('App Window is not Defined');

  const { filePaths, canceled } = await dialog.showOpenDialog(
    appWindow,
    options
  );

  if (canceled || !filePaths.length) throw new Error('Invalid File Path');

  return filePaths;
};

const onStarted = <T>(channel: Channels, payload: T) => {
  if (!appWindow) return;

  appWindow.webContents.send(channel, payload);
};

const onProgress = <T>(channel: Channels, payload: T) => {
  if (!appWindow) return;

  appWindow.webContents.send(channel, payload);
};

const onDone = <T>(channel: Channels, payload: T) => {
  if (!appWindow) return;

  appWindow.webContents.send(channel, payload);
};

const onError = <T>(channel: Channels, payload: T, error: unknown) => {
  if (!appWindow) return;

  appWindow.webContents.send(channel, {
    error,
  });
};

ipcMain.handle('uploadFiles', async (event, args: any[]) => {
  try {
    const filePaths = await showOpenDialog({
      properties: ['openFile'],
    });

    for (const folderId of args) {
      uploadFile(folderId, filePaths[0], path.basename(filePaths[0])).then(
        (_) => console.log('File Uploaded')
      );
    }
  } catch (error) {
    console.log('Error while upload file to box', (error as any).message);
  }
});

ipcMain.handle('uploadVideo', async (event, args: any[]) => {
  try {
    const filePaths = await showOpenDialog({
      properties: ['openFile'],
      filters: [
        {
          name: 'Videos',
          extensions: ['mp4'],
        },
      ],
    });

    const fileSize = statSync(filePaths[0]).size;

    const uploader = await uploadChunkFile(
      BOX_MAP.UPLOAD_PASSED_VIDEO,
      fileSize,
      filePaths[0],
      `${args[0]}.mp4`
    );
    uploader.on('uploadComplete', (_) =>
      onDone<number>('uploadVideoDone', 100)
    );

    let uploaded = 0;
    uploader.on('chunkUploaded', (chunk) => {
      uploaded += chunk.part.size;
      onProgress(
        'uploadVideoProgress',
        Math.floor((uploaded / fileSize) * 100)
      );
    });
    onStarted('uploadVideoStarted', 0);
    await uploader.start();
  } catch (error) {
    console.log('Error while upload video to box', (error as any).message);
  }
});

ipcMain.handle('downloadFiles', async (event, args: any[]) => {
  try {
    const filePaths = await showOpenDialog();

    const promiseList: Promise<void>[] = [];
    for (const template of args) {
      const localFilePath = path.resolve(
        filePaths[0],
        `${template.fileName}.opf`
      );
      promiseList.push(
        downloadFilePromise(BOX_MAP.QA_DATAVYU_TEMPLATE, localFilePath).then(
          () => {
            const cellCodes = [
              `PLAY_${template.id}`,
              new Date(template.birthdate).toLocaleDateString('en-US'),
              new Date(template.date).toLocaleDateString('en-US'),
              template.language.charAt(0).toLowerCase(),
              '.',
            ];

            insertCell(localFilePath, 'PLAY_ID', cellCodes);
          }
        )
      );
    }

    Promise.all(promiseList).catch((error) => {
      console.error('An error occured while downloading Files', error);
    });
  } catch (error) {
    console.log('Error while downloading box file', error);
  }
});

ipcMain.handle('downloadAssets', async (event, args: Asset[]) => {
  if (!getCookies()) throw Error('You must be logged into Databrary');

  try {
    const filePaths = await showOpenDialog();

    const promiseList: Promise<void>[] = [];
    for (const asset of args) {
      const localFilePath = path.resolve(
        filePaths[0],
        `${asset.assetName || asset.assetId}.mp4`
      );

      promiseList.push(
        downloadAssetPromise(
          asset,
          localFilePath,
          onStarted,
          onProgress,
          onDone,
          onError
        )
      );
    }

    Promise.all(promiseList).catch((error) => {
      console.error('An error occured while download Assets', error);
    });
  } catch (error) {
    console.log('Error while downloading databrary Asset', error);
  }
});

ipcMain.handle('volumeInfo', async (event, args) => {
  if (!getCookies()) throw Error('You must be logged into Databrary');

  const volumeId = args[0];
  if (!volumeId) throw Error('You need a valid volume id');

  try {
    const volumeInfo = await getVolumeInfo(volumeId);
    return volumeInfo;
  } catch (error) {
    throw Error(`Volume ${volumeId} - ${(error as any).message}`);
  }
});

ipcMain.handle('databraryLogin', async (event, args) => {
  const { email, password } = args[0];
  try {
    await login(email, password);
    // if (appWindow) appWindow.loadURL(resolveHtmlPath('index.html'));
    return;
  } catch (error) {
    throw Error(`Cannot login to Databrary - ${(error as any).message}`);
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
