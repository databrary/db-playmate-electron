import {
  CircularProgress,
  CircularProgressProps,
  IconButton,
} from '@mui/material';

const AssetProgress = ({ value, size, ...props }: CircularProgressProps) => {
  return (
    <IconButton aria-label="download-done" size="small" disabled>
      <CircularProgress
        variant="determinate"
        value={value}
        size={size}
        {...props}
      />
    </IconButton>
  );
};

export default AssetProgress;
