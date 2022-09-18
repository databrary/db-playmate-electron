import { MouseEvent, useState } from 'react';

import {
  IconButton,
  LinearProgress,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';
import { Box } from '@mui/system';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { Progress } from '../../types';

const DownloadMenu = () => {
  const [downloads, setDownloads] = useState<Record<string, Progress>>({});
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleOpenUserMenu = (event: MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  return (
    <>
      <Tooltip title="Downloads">
        <IconButton color="inherit" onClick={handleOpenUserMenu}>
          <DashboardIcon />
        </IconButton>
      </Tooltip>
      <Menu
        sx={{ mt: '45px' }}
        id="menu-appbar"
        anchorEl={anchorElUser}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorElUser)}
        onClose={handleCloseUserMenu}
      >
        {Object.values(downloads).map((download) => (
          <MenuItem
            sx={{
              minWidth: '120px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'start',
            }}
            key={download.id}
            onClick={handleCloseUserMenu}
          >
            <Typography sx={{ mb: 0.5, width: '100%' }}>
              {download.path
                ? // eslint-disable-next-line no-useless-escape
                  download.path.replace(/^.*[\\\/]/, '')
                : download.id}
            </Typography>
            <Box sx={{ width: '100%' }}>
              <LinearProgress
                variant="determinate"
                value={download.percentage}
              />
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default DownloadMenu;
