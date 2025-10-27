import React from 'react';
import { makeStyles, Theme } from '@material-ui/core/styles';
import { Paper, Typography, List, ListItem, ListItemText, Button } from '@material-ui/core';
import useVideoContext from '../../hooks/useVideoContext/useVideoContext';

const useStyles = makeStyles((theme: Theme) => ({
  container: {
    padding: theme.spacing(2),
    maxHeight: '300px',
    overflow: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  },
  list: {
    maxHeight: '250px',
    overflow: 'auto',
  },
  listItem: {
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  participant: {
    fontWeight: 'bold',
    color: theme.palette.primary.main,
  },
  timestamp: {
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
  },
}));

export default function TranscriptionDisplay() {
  const classes = useStyles();
  const { transcriptions, clearTranscriptions } = useVideoContext();

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <Paper className={classes.container}>
      <div className={classes.header}>
        <Typography variant="h6">Live Transcriptions</Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={clearTranscriptions}
          disabled={transcriptions.length === 0}
        >
          Clear
        </Button>
      </div>

      {transcriptions.length === 0 ? (
        <Typography variant="body2" color="textSecondary">
          No transcriptions yet. Start speaking to see live transcriptions appear here.
        </Typography>
      ) : (
        <List className={classes.list}>
          {transcriptions.map((transcript, index) => (
            <ListItem key={index} className={classes.listItem}>
              <ListItemText
                primary={
                  <>
                    <span className={classes.participant}>{transcript.participant}: </span>
                    {transcript.transcription}
                  </>
                }
                secondary={
                  <span className={classes.timestamp}>
                    {formatTime(transcript.timestamp)}
                  </span>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
}
