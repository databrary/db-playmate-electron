import axios from 'axios';
import url from 'url';
import os from 'os';
import querystring from 'querystring';
import keytar from 'keytar';
import envVariables from '../../env.json';

const { BOX_CLIENT_ID, BOX_CLIENT_SECRET, BOX_REDIRECT_URI } = envVariables;

const baseUrl = 'https://account.box.com/api/oauth2';

const keytarService = 'play-box';
const keytarAccount = os.userInfo().username;

let accessToken: string | null = null;
let refreshToken: string | null = null;

function getAccessToken() {
  return accessToken;
}

const getLogOutUrl = () => {
  return `https://${baseUrl}/v2/logout`;
};

const logout = async () => {
  await keytar.deletePassword(keytarService, keytarAccount);
  accessToken = null;
  refreshToken = null;
};

const getAuthenticationURL = () => {
  return `${baseUrl}/authorize?response_type=code&client_id=${BOX_CLIENT_ID}&redirect_uri=${BOX_REDIRECT_URI}`;
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
    if (refreshToken) {
      await keytar.setPassword(keytarService, keytarAccount, refreshToken);
    }
  } catch (error) {
    await logout();

    throw error;
  }
};

export {
  getAccessToken,
  getAuthenticationURL,
  getLogOutUrl,
  loadTokens,
  logout,
  refreshTokens,
};
