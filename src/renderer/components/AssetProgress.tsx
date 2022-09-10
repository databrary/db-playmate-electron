import { CircularProgress, IconButton } from '@mui/material';

type Props = {
  value: number | undefined;
  size: string | number | undefined;
};

const AssetProgress = ({ value, size }: Props) => {
  return (
    <IconButton aria-label="download-done" size="small" disabled>
      <CircularProgress variant="determinate" value={value} size={size} />
    </IconButton>
  );
};

export default AssetProgress;
