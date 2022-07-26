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
import { statSync, createWriteStream } from 'fs';
import {
  Progress,
  Volume,
  Channels,
  StudyDownloadFunction,
  StudyBuildFunction,
  StudyFileNameFunction,
} from '../types';
import MenuBuilder from './menu';
import { getVolume, STUDY_MAP } from '../util';
import {
  AppUpdater,
  installExtensions,
  isDebugMode,
  resolveHtmlPath,
} from './extensions';
import {
  getCookies,
  getVolumeInfo,
  login,
  isLoggedIn,
  downloadAsset,
} from '../services/databrary-service';
import {
  downloadFile,
  downloadBuffer,
  ls,
  uploadChunkFile,
  uploadFile,
} from '../services/box-service';
import { BOX_MAP, defaultVolume } from '../constants';
import { Cell, OPF } from '../OPF';
import envVariables from '../../env.json';

let appWindow: BrowserWindow | null = null;

const { DATABRARY_USERNAME, DATABRARY_PASSWORD } = envVariables;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug = isDebugMode();

if (isDebug) {
  require('electron-debug')();
}

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

const onEvent = <T>(channel: Channels, payload: T) => {
  if (!appWindow) return;

  appWindow.webContents.send(channel, payload);
};

ipcMain.handle('uploadFile', async (event, args: any[]) => {
  if (args.length !== 1) throw Error(`More that one box folder was provided`);
  const folderId = args[0];

  const filePaths = await showOpenDialog({
    properties: ['openFile'],
  });

  const file = await uploadFile(
    folderId,
    filePaths[0],
    path.basename(filePaths[0])
  );

  if (folderId === BOX_MAP.QA_FAILED) {
    return file;
  }

  const qaOPF = OPF.readOPF(filePaths[0]);

  Object.entries(STUDY_MAP).forEach(
    async ([key, { download, build, resolveFilePath }]) => {
      const newFilePath = (resolveFilePath as StudyFileNameFunction)(
        path.parse(filePaths[0])
      );

      await (download as StudyDownloadFunction)(newFilePath);

      const newOPF = (build as StudyBuildFunction)(
        qaOPF,
        OPF.readOPF(newFilePath)
      );

      OPF.writeOPF(newFilePath, newOPF);
    }
  );
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
      onEvent<number>('uploadVideoDone', 100)
    );

    let uploaded = 0;
    uploader.on('chunkUploaded', (chunk) => {
      uploaded += chunk.part.size;
      onEvent('uploadVideoProgress', Math.floor((uploaded / fileSize) * 100));
    });
    onEvent('uploadVideoStarted', 0);
    await uploader.start();
  } catch (error) {
    onEvent('uploadVideoError', (error as any).message);
    console.log('Error while upload video to box', (error as any).message);
  }
});

ipcMain.handle('downloadOPF', async (event, args: any[]) => {
  try {
    const filePaths = await showOpenDialog();

    for (const template of args) {
      const localFilePath = path.resolve(
        filePaths[0],
        `${template.fileName}.opf`
      );
      try {
        // eslint-disable-next-line no-await-in-loop
        await downloadFile(BOX_MAP.QA_DATAVYU_TEMPLATE, localFilePath);
        const qaOPF = OPF.readOPF(localFilePath);
        const playId = [
          `PLAY_${template.volumeId}_${template.sessionId}`,
          new Date(template.birthdate).toLocaleDateString('en-US', {
            timeZone: 'UTC',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }),
          new Date(template.date).toLocaleDateString('en-US', {
            timeZone: 'UTC',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }),
          template.language && template.language.split(',')[0]
            ? template.language.split(',')[0].trim().charAt(0).toLowerCase()
            : '.',
          template.language && template.language.split(',')[1]
            ? template.language.split(',')[1].trim().charAt(0).toLowerCase()
            : '.',
        ];

        qaOPF.clearColumn('PLAY_ID');
        const playIdColumn = qaOPF.column('PLAY_ID');
        playIdColumn.addCell(new Cell(`(${playId.join(',')})`));

        const qaId = [
          `${template.siteId}`,
          `${template.id}`,
          '',
          '',
          '',
          '',
          '',
        ];
        qaOPF.clearColumn('QA_ID');
        const qaIdColumn = qaOPF.column('QA_ID');
        qaIdColumn.addCell(new Cell(`(${qaId.join(',')})`));
        OPF.writeOPF(localFilePath, qaOPF);

        onEvent('downloadedOPF', []);
      } catch (error) {
        console.error('An error occured while downloading Files', error);
      }
    }
  } catch (error) {
    console.log('Error while downloading box file', error);
  }
});

// TODO: Manage errors
const downloadAssetPromise = async (
  id: string,
  filePath: string,
  onEvent: <T>(channel: Channels, payload: T) => void
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const stream = createWriteStream(filePath, {
      autoClose: true,
    });

    let progress: Progress = {
      id,
      path: filePath,
      status: undefined,
      percentage: 0,
      message: undefined,
      name: path.parse(filePath).base,
    };

    downloadAsset(id)
      .then((response) => {
        progress = {
          ...progress,
          status: 'STARTED',
        };

        onEvent<Progress>(`downloadProgress-${id}`, progress);

        const writer = response.data.pipe(stream);
        const totalSize = response.headers['content-length'];

        let downloaded = 0;

        response.data.on('data', (data: any) => {
          downloaded += Buffer.byteLength(data);

          progress = {
            ...progress,
            status: 'PROGRESS',
            percentage: Math.floor((downloaded / parseFloat(totalSize)) * 100),
          };

          onEvent<Progress>(`downloadProgress-${id}`, progress);
        });

        response.data.on('end', () => {
          console.log(`Downloaded Asset ${id}`);
        });

        writer.on('finish', () => {
          progress = {
            ...progress,
            status: 'DONE',
            percentage: 100,
          };
          onEvent<Progress>(`downloadProgress-${id}`, progress);
          resolve();
        });

        return null;
      })
      .catch((error) => {
        console.log(`Error while downloading asset ${id}`, error.message);
        progress = {
          ...progress,
          status: 'ERRORED',
          message: `${error.message}`,
        };
        onEvent<Progress>(`downloadProgress-${id}`, progress);
        // onError<Asset>(asset.assetId, error);
        reject();
      });
  });
};

ipcMain.handle('downloadAssets', async (event, args: any[]) => {
  if (!getCookies()) throw Error('You must be logged into Databrary');

  try {
    const filePaths = await showOpenDialog();

    const promiseList: Promise<void>[] = [];
    for (const { name, id } of args) {
      const localFilePath = path.resolve(filePaths[0], `${name || id}.mp4`);

      promiseList.push(downloadAssetPromise(id, localFilePath, onEvent));
    }

    Promise.all(promiseList).catch((error) => {
      console.error('An error occured while download Assets', error);
    });
  } catch (error) {
    console.log('Error while downloading databrary Asset', error);
  }
});

const getVolumes = async (volumes: string[]) => {
  const volumesMap: Record<string, Volume> = {};
  for (const volumeId of volumes) {
    try {
      onEvent('status', `Fetching Volume ${volumeId} data...`);
      // eslint-disable-next-line no-await-in-loop
      const volumeInfo = await getVolumeInfo(volumeId);
      volumesMap[volumeId] = getVolume(volumeInfo);
    } catch (error) {
      console.log(`getVolumes - ${volumeId} - Error`, (error as any).message);

      onEvent('status', `Error while fetching Volume ${volumeId} data...`);
      volumesMap[volumeId] = {
        ...defaultVolume,
        id: volumeId,
      };
    }
  }
  return volumesMap;
};

const getBoxVideos = async (folderId = BOX_MAP.UPLOAD_PASSED_VIDEO) => {
  try {
    onEvent('status', 'Fetching Box Videos...');
    const entries = await ls(folderId);
    return entries;
  } catch (error) {
    console.log('getBoxVideos - Error', (error as any).message);
    onEvent('status', 'Error Fetching Box Videos...');
  }

  return [];
};

const getQAPassed = async (folderId = BOX_MAP.QA_PASSED) => {
  try {
    onEvent('status', 'Fetching Passed QA...');
    const entries = await ls(folderId);
    return entries;
  } catch (error) {
    console.log('getQAPassed - Error', (error as any).message);
    onEvent('status', 'Error Fetching Passed QA...');
  }

  return [];
};

const getQAFailed = async (folderId = BOX_MAP.QA_FAILED) => {
  try {
    onEvent('status', 'Fetching Failed QA...');
    const entries = await ls(folderId);
    return entries;
  } catch (error) {
    console.log('getQAFailed - Error', (error as any).message);
    onEvent('status', 'Error Fetching Failed QA...');
  }
  return [];
};

ipcMain.handle('loadData', async (event, args) => {
  if (!getCookies()) throw Error('You must be logged into Databrary');

  const buffer = await downloadBuffer(BOX_MAP.VOLUMES);
  const volumesList = JSON.parse(buffer.toString('utf8'));

  const volumes = await getVolumes(volumesList);
  const videos = await getBoxVideos();
  const passed = await getQAPassed();
  const failed = await getQAFailed();

  return {
    databrary: { volumes },
    box: {
      videos,
      passed,
      failed,
    },
  };
});

ipcMain.handle('databraryLogin', async (event, args) => {
  const { email, password } = args[0];
  try {
    await login(email, password);
  } catch (error) {
    throw Error(`Cannot login to Databrary - ${(error as any).message}`);
  }
});

ipcMain.handle('isDatabraryConnected', async (event, args) => {
  if (process.env.NODE_ENV !== 'development') return isLoggedIn();

  try {
    await login(DATABRARY_USERNAME, DATABRARY_PASSWORD);
  } catch (error) {
    throw Error(`Cannot login to Databrary - ${(error as any).message}`);
  }

  return true;
});

// eslint-disable-next-line import/prefer-default-export
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
