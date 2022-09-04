import axios from 'axios';
import url from 'url';
import os from 'os';
import querystring from 'querystring';
import keytar from 'keytar';
import { createWriteStream, createReadStream } from 'fs';
import envVariables from '../../env.json';

const BoxSDK = require('box-node-sdk');

const { BOX_CLIENT_ID, BOX_CLIENT_SECRET, BOX_REDIRECT_URI } = envVariables;

const BASE_URL = 'https://account.box.com/api/oauth2';
const BASE_API_URL = 'https://api.box.com/2.0';

const axiosInstance = axios.create({
  baseURL: BASE_API_URL,
  withCredentials: true,
});

const keytarService = 'play-box';
const keytarAccount = os.userInfo().username;

let accessToken: string | null = null;
let refreshToken: string | null = null;
let client: any = null;

function getAccessToken() {
  return accessToken;
}

const getLogOutUrl = () => {
  return `https://${BASE_URL}/v2/logout`;
};

const logout = async () => {
  await keytar.deletePassword(keytarService, keytarAccount);
  accessToken = null;
  refreshToken = null;
};

const getAuthenticationURL = () => {
  return `${BASE_URL}/authorize?response_type=code&client_id=${BOX_CLIENT_ID}&redirect_uri=${BOX_REDIRECT_URI}`;
};

const refreshTokens = async () => {
  const refreshToken = await keytar.getPassword(keytarService, keytarAccount);

  if (!refreshToken) throw new Error('No available refresh token.');

  const refreshOptions = {
    grant_type: 'refresh_token',
    client_id: BOX_CLIENT_ID,
    refresh_token: refreshToken,
    client_secret: BOX_CLIENT_SECRET,
  };

  try {
    const response = await axios.post(
      `https://api.box.com/oauth2/token`,
      querystring.stringify(refreshOptions)
    );

    accessToken = response.data.access_token;
    client = BoxSDK.getBasicClient(accessToken);
    axiosInstance.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  } catch (error) {
    await logout();

    throw error;
  }
};

const loadTokens = async (callbackURL: string) => {
  const {
    query: { code },
  } = url.parse(callbackURL, true);

  const exchangeOptions = {
    grant_type: 'authorization_code',
    client_id: BOX_CLIENT_ID,
    code,
    client_secret: BOX_CLIENT_SECRET,
  };

  try {
    const response = await axios.post(
      `https://api.box.com/oauth2/token`,
      querystring.stringify(exchangeOptions)
    );
    accessToken = response.data.access_token;
    client = BoxSDK.getBasicClient(accessToken);
    axiosInstance.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
    refreshToken = response.data.refresh_token;
    if (refreshToken) {
      await keytar.setPassword(keytarService, keytarAccount, refreshToken);
    }
  } catch (error) {
    await logout();

    throw error;
  }
};

const uploadFile = async (
  folderId: string,
  filePath: string,
  fileName: string
) => {
  const stream = createReadStream(filePath);
  const file = await client.files.uploadFile(folderId, fileName, stream);

  return file;
};

/**
 * For files > 50MB
 * @param folderId
 * @param fileSize
 * @param filePath
 * @param fileName
 */
const uploadChunkFile = async (
  folderId: string,
  fileSize: number,
  filePath: string,
  fileName: string
) => {
  const stream = createReadStream(filePath);
  const uploader = await client.files.getChunkedUploader(
    folderId,
    fileSize,
    fileName,
    stream
  );

  return uploader;
};

const downloadFile = async (fielId: string) => {
  const response = await axiosInstance.get(`files/${fielId}/content`, {
    responseType: 'stream',
  });

  return response;
};

const downloadFilePromise = async (
  fileId: string,
  filePath: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const stream = createWriteStream(filePath, {
      autoClose: true,
    });

    downloadFile(fileId)
      .then((response) => {
        const writer = response.data.pipe(stream);

        writer.on('finish', () => {
          resolve();
        });
      })
      .catch((error) => {
        reject();
      });
  });
};

const ls = async (folderId: string) => {
  const items = await client.folders.getItems(folderId);
  return items.entries || [];
};

export {
  getAccessToken,
  getAuthenticationURL,
  getLogOutUrl,
  loadTokens,
  logout,
  refreshTokens,
  uploadChunkFile,
  uploadFile,
  downloadFilePromise,
  ls,
};
