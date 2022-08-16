import axios from 'axios';
import { createWriteStream } from 'fs';
import { Asset } from 'types';

const BASE_API_URL = 'https://nyu.databrary.org/api';
const BASE_URL = 'https://nyu.databrary.org';

// eslint-disable-next-line prefer-const
const axiosInstance = axios.create({
  baseURL: BASE_API_URL,
  withCredentials: true,
});

const getCookies = () => {
  return !!axiosInstance.defaults.headers.common.Cookie;
};

const getCsverf = () => {
  return !!axiosInstance.defaults.headers.common['x-csverf'];
};

const isLoggedIn = () => {
  return getCookies() && getCsverf();
};

const login = async (email: string, password: string, superuser = false) => {
  const response = await axiosInstance.post('/user/login', {
    email,
    password,
    superuser,
  });

  const setCookie = (response.headers['set-cookie'] || [])[0];
  axiosInstance.defaults.headers.common.Cookie = setCookie;
  axiosInstance.defaults.headers.common['x-csverf'] = response.data.csverf;
};

const downloadAsset = async (assetId: string | number) => {
  if (!getCookies() || !getCsverf())
    throw Error('Must be logged into Databrary');

  const url = `${BASE_URL}/asset/${assetId}/download?inline=false`;

  const response = await axiosInstance.get(url, {
    responseType: 'stream',
  });

  return response;
};

// TODO: Manage errors
export const downloadAssetPromise = async (
  asset: Asset,
  filePath: string,
  onStart: (newAsset: Asset) => void,
  onProgress: (newAsset: Asset) => void,
  onEnd: (newAsset: Asset) => void,
  onError: (newAsset: Asset, error: unknown) => void
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const stream = createWriteStream(filePath, {
      autoClose: true,
    });

    let newAsset = {
      ...asset,
      path: filePath,
    };

    downloadAsset(newAsset.assetId)
      .then((response) => {
        onStart(newAsset);

        const writer = response.data.pipe(stream);
        const totalSize = response.headers['content-length'];

        let downloaded = 0;

        response.data.on('data', (data: any) => {
          downloaded += Buffer.byteLength(data);

          newAsset = {
            ...newAsset,
            percentage: Math.floor((downloaded / parseFloat(totalSize)) * 100),
          };

          onProgress(newAsset);
        });

        response.data.on('end', () => {
          console.log(`Download Asset ${asset} eneded`);
        });

        writer.on('finish', () => {
          newAsset = {
            ...newAsset,
            percentage: 100,
          };
          onEnd(newAsset);
          resolve();
        });

        return null;
      })
      .catch((error) => {
        console.log(
          `Error while downloading asset ${asset.assetName}`,
          error.message
        );
        // onAssetDowmloadError(asset.assetId, error);
        reject();
      });
  });
};

const getVolumeInfo = async (volumeId: string): Promise<unknown> => {
  const params = {
    access: '',
    citation: '',
    links: '',
    funding: '',
    top: '',
    tags: '',
    excerpts: '',
    comments: '',
    records: '',
    containers: 'all',
    metrics: '',
    state: '',
  };

  const response = await axiosInstance.get(`/volume/${volumeId}`, {
    params: {
      ...params,
    },
  });

  return response.data;
};

export { login, getVolumeInfo, getCookies, downloadAsset, isLoggedIn };
