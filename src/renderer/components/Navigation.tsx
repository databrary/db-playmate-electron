import { useEffect } from 'react';
import { styled } from '@mui/material/styles';
import {
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CssBaseline,
  Box,
  Tooltip,
} from '@mui/material';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import MenuIcon from '@mui/icons-material/Menu';
import RefreshIcon from '@mui/icons-material/Refresh';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { drawerWidth } from '../../constants';
import DrawerHeader from './DrawerHeader';
import DownloadMenu from './DownloadMenu';
import { useAppSelector } from '../hooks/store';
import { RootState } from '../store/store';
import { Volume } from '../../types';

type Props = {
  open: boolean;
  onVolumeClick: (volume: string) => void;
  onDrawerClick: (open: boolean) => void;
  onRefresh: () => void;
};

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Navigation = ({
  open,
  onVolumeClick,
  onDrawerClick,
  onRefresh,
}: Props) => {
  const volumes = useAppSelector((state: RootState) => state.databrary.volumes);

  const onClick = (volume) => {
    if (onVolumeClick) onVolumeClick(volume);
  };

  const onOpenDrawer = () => {
    if (onDrawerClick) onDrawerClick(true);
  };

  const onCloseDrawer = () => {
    if (onDrawerClick) onDrawerClick(false);
  };

  return (
    <>
      <CssBaseline />
      <AppBar position="fixed" open={open}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={onOpenDrawer}
            edge="start"
            sx={{ mr: 2, ...(open && { display: 'none' }) }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Play Project
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              ml: 'auto',
            }}
          >
            <Tooltip sx={{ mr: 1 }} title="Refresh Play Data">
              <IconButton
                color="inherit"
                aria-label="refresh"
                onClick={onRefresh}
                edge="end"
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <DownloadMenu />
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      >
        <DrawerHeader>
          <Typography
            sx={{
              fontWeight: 'bold',
            }}
            noWrap
            component="div"
          >
            Volumes
          </Typography>
          <IconButton onClick={onCloseDrawer}>
            <ChevronLeftIcon />
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List>
          {(Object.values(volumes) || []).map((volume) => (
            <Box key={volume.id}>
              <ListItem disablePadding>
                <ListItemButton>
                  <ListItemText
                    sx={{
                      ml: 2,
                    }}
                    primary={`${volume.id} - ${(volume as Volume).name || ''}`}
                    onClick={() => onClick(volume.id)}
                  />
                </ListItemButton>
              </ListItem>
              <Divider variant="middle" />
            </Box>
          ))}
        </List>
      </Drawer>
    </>
  );
};

export default Navigation;
