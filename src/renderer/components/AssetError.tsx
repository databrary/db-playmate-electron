import { Alert, Snackbar } from '@mui/material';
import { SyntheticEvent, useState } from 'react';
import AssetDownload from './AssetDownload';

type Props = {
  onClick: () => void;
  message: string;
};

const AssetError = ({ message, onClick }: Props) => {
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
        <Alert onClose={handleClose} severity="error" sx={{ width: '100%' }}>
          Error downloading Asset {message}
        </Alert>
      </Snackbar>
      <AssetDownload onClick={onClick} />
    </>
  );
};

export default AssetError;
