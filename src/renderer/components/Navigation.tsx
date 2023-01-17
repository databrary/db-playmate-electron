import { useEffect, useState } from 'react';
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
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import MenuIcon from '@mui/icons-material/Menu';
import RefreshIcon from '@mui/icons-material/Refresh';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import SortByAlphaIcon from '@mui/icons-material/SortByAlpha';
import { drawerWidth } from '../constants';
import DrawerHeader from './DrawerHeader';
import { useAppSelector } from '../hooks/store';
import { RootState } from '../store/store';
import { Volume } from '../../types';
import logo from '../../../assets/logo.png';

type LocalVolume = Volume & {
  site: string | undefined;
};

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
  backgroundColor: 'white',
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

  const [localVolumes, setLocalVolumes] = useState<LocalVolume[]>([]);
  const [sortBy, setSortBy] = useState('volume');

  useEffect(() => {
    setLocalVolumes(
      Object.values(volumes).map((volume) => ({
        ...volume,
        site: (volume as Volume).name
          ? (volume as Volume).name.split('_')[1]
          : undefined,
      }))
    );
  }, [volumes]);

  const onSortBy = (
    event: React.MouseEvent<HTMLElement>,
    newSortBy: string | null
  ) => {
    if (newSortBy !== null) {
      setSortBy(newSortBy);
    }
  };

  const onSortByVolume = () => {
    const sortedArray = localVolumes.sort((volumeA: any, volumeB: any) => {
      return volumeA.id - volumeB.id;
    });

    setLocalVolumes([...sortedArray]);
  };

  const onSortBySite = () => {
    const sortedArray = localVolumes.sort(
      (volumeA: LocalVolume, volumeB: LocalVolume) => {
        const a = volumeA.name.toUpperCase();
        const b = volumeB.name.toUpperCase();
        if (a < b) {
          return -1;
        }

        if (a > b) {
          return 1;
        }

        // names must be equal
        return 0;
      }
    );
    setLocalVolumes([...sortedArray]);
  };

  useEffect(() => {
    if (sortBy === 'volume') {
      onSortByVolume();
    } else if (sortBy === 'site') {
      onSortBySite();
    }
  }, [sortBy]);

  const onClick = (volumeId: string) => {
    if (onVolumeClick) onVolumeClick(volumeId);
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
            <MenuIcon sx={{ color: 'green' }} />
          </IconButton>
          <Box
            component="img"
            sx={{ height: 55, width: 105 }}
            alt="Your logo."
            src={logo}
          />
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
                <RefreshIcon sx={{ color: 'green' }} />
              </IconButton>
            </Tooltip>
            {/* <DownloadMenu /> */}
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
          <Box
            sx={{
              mx: 2,
              my: 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <ToggleButtonGroup
              color="primary"
              value={sortBy}
              exclusive
              onChange={onSortBy}
              aria-label="text alignment"
              size="small"
            >
              <ToggleButton value="volume">
                <FormatListNumberedIcon />
              </ToggleButton>
              <ToggleButton value="site">
                <SortByAlphaIcon />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <IconButton onClick={onCloseDrawer}>
            <ChevronLeftIcon sx={{ color: 'green' }} />
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List>
          {localVolumes.map((volume: LocalVolume) => (
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
