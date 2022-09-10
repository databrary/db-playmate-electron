import { IconButton, Tooltip } from '@mui/material';
import TheatersIcon from '@mui/icons-material/Theaters';

type Props = {
  onClick: () => void;
};

const AssetDownload = ({ onClick }: Props) => {
  return (
    <Tooltip title="Download Video from Databrary" placement="top">
      <IconButton aria-label="download" onClick={onClick} size="small">
        <TheatersIcon />
      </IconButton>
    </Tooltip>
  );
};

export default AssetDownload;
