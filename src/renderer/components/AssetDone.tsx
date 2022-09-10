import { Alert, IconButton, Snackbar } from '@mui/material';
import DownloadDoneIcon from '@mui/icons-material/DownloadDone';
import { SyntheticEvent, useState } from 'react';

const AssetDone = () => {
  const [open, setOpen] = useState(true);

  const handleClose = (event?: SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpen(false);
  };

  return (
    <>
      <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
        <Alert onClose={handleClose} severity="success" sx={{ width: '100%' }}>
          Asset downloaded!
        </Alert>
      </Snackbar>
      <IconButton aria-label="download-done" size="small" disabled>
        <DownloadDoneIcon />
      </IconButton>
    </>
  );
};

export default AssetDone;
