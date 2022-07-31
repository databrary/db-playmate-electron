import axios from 'axios';
import volumeData from './volume899.json';

const BASE_API_URL = 'https://nyu.databrary.org/api';
const BASE_URL = 'https://nyu.databrary.org/';
let csverf: string | null = null;
let cookie: string | null = null;
// eslint-disable-next-line prefer-const
const axiosInstance = axios.create({
  baseURL: BASE_API_URL,
  withCredentials: true,
});

const getCookies = () => {
  return cookie;
};

const login = async (email: string, password: string, superuser = false) => {
  const response = await axiosInstance.post('/user/login', {
    email,
    password,
    superuser,
  });

  const setCookie = (response.headers['set-cookie'] || [])[0];
  cookie = setCookie;
  csverf = response.data.csverf;
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

  if (!cookie) throw Error('Databrary Cokkie is missing');

  const response = await axiosInstance.get(`/volume/${volumeId}`, {
    params: {
      ...params,
    },
    headers: {
      Cookie: cookie,
    },
  });

  return response.data;
};

export { login, getVolumeInfo, getCookies };
