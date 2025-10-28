import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  makeStyles,
  Theme,
  Typography,
  Snackbar,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';

const useStyles = makeStyles((theme: Theme) => ({
  dialog: {
    minWidth: '500px',
    [theme.breakpoints.down('sm')]: {
      minWidth: 'auto',
    },
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500],
  },
  linkContainer: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  linkField: {
    '& input': {
      fontSize: '14px',
      fontFamily: 'monospace',
    },
  },
  copyButton: {
    marginTop: theme.spacing(1),
  },
  description: {
    marginBottom: theme.spacing(2),
    color: theme.palette.text.secondary,
  },
}));

interface ShareLinkDialogProps {
  open: boolean;
  onClose: () => void;
  roomName: string;
}

export default function ShareLinkDialog({ open, onClose, roomName }: ShareLinkDialogProps) {
  const classes = useStyles();
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);

  // Generate the meeting link
  const meetingLink = `${window.location.origin}${window.location.pathname}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(meetingLink);
      setShowCopiedMessage(true);
      console.log('[ShareLinkDialog] Link copied to clipboard:', meetingLink);
    } catch (error) {
      console.error('[ShareLinkDialog] Failed to copy link:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = meetingLink;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setShowCopiedMessage(true);
        console.log('[ShareLinkDialog] Link copied to clipboard (fallback method)');
      } catch (err) {
        console.error('[ShareLinkDialog] Fallback copy failed:', err);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleCloseCopiedMessage = () => {
    setShowCopiedMessage(false);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        aria-labelledby="share-link-dialog-title"
        maxWidth="sm"
        fullWidth
        classes={{ paper: classes.dialog }}
      >
        <DialogTitle id="share-link-dialog-title">
          Share Meeting Link
          <IconButton aria-label="close" className={classes.closeButton} onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" className={classes.description}>
            Share this link with others to invite them to join this meeting.
          </Typography>
          <div className={classes.linkContainer}>
            <TextField
              fullWidth
              variant="outlined"
              value={meetingLink}
              InputProps={{
                readOnly: true,
              }}
              className={classes.linkField}
              onClick={(e) => {
                (e.target as HTMLInputElement).select();
              }}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="default">
            Close
          </Button>
          <Button onClick={handleCopyLink} color="primary" variant="contained">
            Copy Link
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        open={showCopiedMessage}
        autoHideDuration={2000}
        onClose={handleCloseCopiedMessage}
        message="Link copied to clipboard!"
      />
    </>
  );
}
