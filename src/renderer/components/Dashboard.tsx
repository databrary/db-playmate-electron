import { useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import { Box } from '@mui/material';
import Volume from './Volume';
import volumes from '../../volumes.json';
import Navigation from './Navigation';
import { drawerWidth } from '../../constants';
import DrawerHeader from './DrawerHeader';

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
  const [volumeList, setVolumeList] = useState<string[]>([]);
  const [selectedVolume, setSelectedVolume] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setVolumeList(volumes);
  }, []);

  const onDrawerClick = (open: boolean) => {
    setDrawerOpen(open);
  };

  const onVolumeClick = (volume: string) => {
    setSelectedVolume(volume);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Navigation
        volumeList={volumeList}
        open={drawerOpen}
        onVolumeClick={onVolumeClick}
        onDrawerClick={onDrawerClick}
      />
      <Main open={drawerOpen}>
        <DrawerHeader />
        {selectedVolume && <Volume volumeId={selectedVolume} />}
      </Main>
    </Box>
  );
};

export default Dashboard;
