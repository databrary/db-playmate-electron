import { useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import { Backdrop, Box, CircularProgress, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import Volume from './Volume';
import volumes from '../../volumes.json';
import Navigation from './Navigation';
import { drawerWidth } from '../../constants';
import DrawerHeader from './DrawerHeader';
import { useAppDispatch } from '../hooks/store';
import { addVolumes } from '../slices/databrary';
import { addVideos, addFailed, addPassed } from '../slices/box';
import { Play } from '../../types';

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth}px`,
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
}));

const Dashboard = () => {
  const { enqueueSnackbar } = useSnackbar();

  const dispatch = useAppDispatch();
  const [volumeList, setVolumeList] = useState<string[]>([]);
  const [isFetcching, setIsFetching] = useState(false);
  const [selectedVolume, setSelectedVolume] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [status, setStatus] = useState('');

  const handleEvent = (...args: unknown[]) => {
    setStatus(args[0] as string);
  };

  const handleDownloadOPF = (...args: unknown[]) => {
    enqueueSnackbar(`QA File Downloaded!`, { variant: 'success' });
  };

  const loadData = (volumeList) => {
    setIsFetching(true);
    window.electron.ipcRenderer
      .invoke<string, Play>('loadData', [...volumeList])
      .then(({ databrary: { volumes }, box: { videos, passed, failed } }) => {
        dispatch(addVolumes(volumes || {}));
        dispatch(addVideos(videos || []));
        dispatch(addPassed(passed || []));
        dispatch(addFailed(failed || []));
      })
      .finally(() => {
        setStatus('');
        setIsFetching(false);
      });
  };

  useEffect(() => {
    window.electron.ipcRenderer.on('status', handleEvent);
    window.electron.ipcRenderer.on('downloadedOPF', handleDownloadOPF);
    setVolumeList(volumes);
  }, []);

  useEffect(() => {
    loadData(volumeList || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volumeList]);

  const onRefresh = () => {
    loadData(volumeList || []);
  };

  const onDrawerClick = (open: boolean) => {
    setDrawerOpen(open);
  };

  const onVolumeClick = (volume: string) => {
    setSelectedVolume(volume);
  };

  return (
    <>
      <Backdrop
        sx={{
          display: 'flex',
          flexDirection: 'column',
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
        open={isFetcching}
      >
        <CircularProgress color="inherit" />
        <Typography>{status}</Typography>
      </Backdrop>
      <Box sx={{ display: 'flex' }}>
        <Navigation
          open={drawerOpen}
          onVolumeClick={onVolumeClick}
          onDrawerClick={onDrawerClick}
          onRefresh={onRefresh}
        />
        <Main open={drawerOpen}>
          <DrawerHeader />
          {selectedVolume && <Volume volumeId={selectedVolume} />}
        </Main>
      </Box>
    </>
  );
};

export default Dashboard;
