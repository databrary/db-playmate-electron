/* eslint global-require: off, no-console: off, promise/always-return: off */
import path from 'path';
import { app, BrowserWindow } from 'electron';
import {
  getAuthenticationURL,
  loadTokens,
  getLogOutUrl,
  logout,
} from '../services/box-service';
import { createAppWindow } from './app';
import { installExtensions, isDebugMode } from './util';

let authWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug = isDebugMode();

if (isDebug) {
  require('electron-debug')();
}

const destroyAuthWin = () => {
  if (!authWindow) return;
  authWindow.close();
  authWindow = null;
};

const createAuthWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  authWindow = new BrowserWindow({
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });
  authWindow.loadURL(getAuthenticationURL());

  const {
    session: { webRequest },
  } = authWindow.webContents;

  const filter = {
    urls: ['http://localhost/callback*'],
  };

  webRequest.onBeforeRequest(filter, async ({ url }) => {
    await loadTokens(url);
    createAppWindow();
    return destroyAuthWin();
  });

  authWindow.on('ready-to-show', () => {
    if (!authWindow) {
      throw new Error('"authWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      authWindow.minimize();
    } else {
      authWindow.show();
    }
  });

  authWindow.on('authenticated', () => {
    destroyAuthWin();
  });

  authWindow.on('closed', () => {
    authWindow = null;
  });
};

const createLogoutWindow = () => {
  const logoutWindow = new BrowserWindow({
    show: false,
  });

  logoutWindow.loadURL(getLogOutUrl());

  logoutWindow.on('ready-to-show', async () => {
    logoutWindow.close();
    await logout();
  });
};

export { createLogoutWindow, createAuthWindow };
