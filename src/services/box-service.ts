import axios from 'axios';
import url from 'url';
import os from 'os';
import querystring from 'querystring';
import keytar from 'keytar';
import { createReadStream, createWriteStream } from 'fs';
import BoxSDK from 'box-node-sdk';
import { BoxEntry } from 'types';
import envVariables from '../../env.json';

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

const setBearer = (accessToken: string) => {
  axiosInstance.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
};

const setClient = (accessToken: string) => {
  client = BoxSDK.getBasicClient(accessToken);
};

const refreshTokens = async () => {
  const refreshToken = await keytar.getPassword(keytarService, keytarAccount);

  if (!refreshToken) throw new Error('Refresh token not available.');

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

    if (!accessToken) throw Error('Access Token not defined');

    setClient(accessToken);
    setBearer(accessToken);
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
    refreshToken = response.data.refresh_token;

    if (!accessToken) throw Error('Box error: the accessToken is not returned');

    setClient(accessToken);
    setBearer(accessToken);
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

const downloadFile = async (
  fielId: string,
  filePath: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    client.files.getReadStream(fielId, null, (error: any, stream: any) => {
      if (error) {
        reject(error.message);
      }

      const output = createWriteStream(filePath);
      const writer = stream.pipe(output);
      writer.on('finish', () => {
        resolve();
      });
    });
  });
};

const downloadBuffer = async (fielId: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    client.files.getReadStream(fielId, null, (error: any, stream: any) => {
      if (error) {
        reject(error.message);
      }

      const chunks: any[] = [];
      stream.on('data', (chunk: any) => chunks.push(Buffer.from(chunk)));
      stream.on('error', (err: any) => reject(err));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  });
};

const ls = async (folderId: string): Promise<BoxEntry[]> => {
  const items = await client.folders.getItems(folderId, { limit: 1000 });
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
  downloadFile,
  downloadBuffer,
  ls,
  setClient,
  setBearer,
};
