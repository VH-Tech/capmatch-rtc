import React, { useState } from 'react';
import Button from '@material-ui/core/Button';
import ShareLinkIcon from '../../../icons/ShareLinkIcon';
import ShareLinkDialog from '../../ShareLinkDialog/ShareLinkDialog';
import useVideoContext from '../../../hooks/useVideoContext/useVideoContext';

export default function ShareLinkButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { room, setIsBackgroundSelectionOpen } = useVideoContext();

  const handleOpenDialog = () => {
    console.log('[ShareLinkButton] Opening share link dialog');
    setIsDialogOpen(true);
    setIsBackgroundSelectionOpen(false);
  };

  const handleCloseDialog = () => {
    console.log('[ShareLinkButton] Closing share link dialog');
    setIsDialogOpen(false);
  };

  if (!room) {
    return null;
  }

  return (
    <>
      <Button
        onClick={handleOpenDialog}
        startIcon={<ShareLinkIcon />}
        data-cy-share-link-button
      >
        Share Link
      </Button>
      <ShareLinkDialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        roomName={room.name}
      />
    </>
  );
}
