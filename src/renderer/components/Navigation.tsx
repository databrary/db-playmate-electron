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
import { NavigateFunction } from 'react-router-dom';
import { withRouter } from 'renderer/withRouter';
import { drawerWidth } from '../../constants';
// import icon from '../../../assets/PLAY-logo.png';
import DrawerHeader from './DrawerHeader';
import DownloadMenu from './DownloadMenu';

type Props = {
  navigate: NavigateFunction;
  open: boolean;
  onVolumeClick: (volume: string) => void;
  onDrawerClick: (open: boolean) => void;
  onRefresh: () => void;
  volumeList?: string[];
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
  navigate,
  open,
  onVolumeClick,
  onDrawerClick,
  onRefresh,
  volumeList = [],
}: Props) => {
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
          {volumeList.map((volume, idx) => (
            <Box key={idx}>
              <ListItem disablePadding>
                <ListItemButton>
                  <ListItemText
                    sx={{
                      ml: 2,
                    }}
                    primary={volume}
                    onClick={() => onClick(volume)}
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

export default withRouter(Navigation);
