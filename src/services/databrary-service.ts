import axios from 'axios';
import { IVolume } from 'interfaces';

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

const getVolumeInfo = async (volumeId: string): Promise<IVolume> => {
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
