import React, { ChangeEvent, FormEvent, useState } from 'react';
import { Typography, makeStyles, TextField, Grid, Button, InputLabel, Theme } from '@material-ui/core';
import { useAppState } from '../../../state';
import { generateRoomCode } from '../../../utils';

const useStyles = makeStyles((theme: Theme) => ({
  gutterBottom: {
    marginBottom: '1em',
  },
  inputContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    margin: '1.5em 0 3.5em',
    '& div:not(:last-child)': {
      marginRight: '1em',
    },
    [theme.breakpoints.down('sm')]: {
      margin: '1.5em 0 2em',
    },
  },
  textFieldContainer: {
    width: '100%',
  },
  continueButton: {
    [theme.breakpoints.down('sm')]: {
      width: '100%',
    },
  },
  buttonGroup: {
    display: 'flex',
    gap: '1em',
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column',
    },
  },
}));

interface RoomNameScreenProps {
  name: string;
  roomName: string;
  setName: (name: string) => void;
  setRoomName: (roomName: string) => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export default function RoomNameScreen({ name, roomName, setName, setRoomName, handleSubmit }: RoomNameScreenProps) {
  const classes = useStyles();
  const { user } = useAppState();
  const [mode, setMode] = useState<'join' | 'create' | null>(null);

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const handleRoomNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setRoomName(event.target.value.toUpperCase());
  };

  const handleCreateNewRoom = (event: React.MouseEvent) => {
    event.preventDefault();
    const newRoomCode = generateRoomCode();
    setRoomName(newRoomCode);
    setMode('create');
  };

  const handleJoinRoom = (event: React.MouseEvent) => {
    event.preventDefault();
    setMode('join');
  };

  const handleBack = () => {
    setMode(null);
    setRoomName('');
  };

  const hasUsername = !window.location.search.includes('customIdentity=true') && user?.displayName;

  // Initial screen with Create/Join buttons
  if (mode === null) {
    return (
      <>
        <Typography variant="h5" className={classes.gutterBottom}>
          Welcome to Video Chat
        </Typography>
        <Typography variant="body1" className={classes.gutterBottom}>
          {hasUsername ? 'Choose an option to get started' : 'Enter your name to get started'}
        </Typography>

        {!hasUsername && (
          <div className={classes.inputContainer}>
            <div className={classes.textFieldContainer}>
              <InputLabel shrink htmlFor="input-user-name">
                Your Name
              </InputLabel>
              <TextField
                id="input-user-name"
                variant="outlined"
                fullWidth
                size="small"
                value={name}
                onChange={handleNameChange}
              />
            </div>
          </div>
        )}

        <Grid container justifyContent="center" spacing={2}>
          <Grid item xs={12} sm={6}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              disabled={!name}
              onClick={handleCreateNewRoom}
            >
              Create New Room
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              variant="outlined"
              color="primary"
              fullWidth
              disabled={!name}
              onClick={handleJoinRoom}
            >
              Join Room
            </Button>
          </Grid>
        </Grid>
      </>
    );
  }

  // Create room mode - shows generated code
  if (mode === 'create') {
    return (
      <>
        <Typography variant="h5" className={classes.gutterBottom}>
          New Room Created
        </Typography>
        <Typography variant="body1" className={classes.gutterBottom}>
          Share this code with others to invite them to your room
        </Typography>

        <div className={classes.inputContainer}>
          <div className={classes.textFieldContainer}>
            <InputLabel shrink htmlFor="input-room-code">
              Room Code
            </InputLabel>
            <TextField
              id="input-room-code"
              variant="outlined"
              fullWidth
              size="small"
              value={roomName}
              InputProps={{
                readOnly: true,
                style: { fontSize: '1.5em', fontWeight: 'bold', letterSpacing: '0.1em', textAlign: 'center' }
              }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Grid container justifyContent="space-between" spacing={2}>
            <Grid item>
              <Button variant="outlined" onClick={handleBack}>
                Back
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                type="submit"
                color="primary"
                className={classes.continueButton}
              >
                Continue
              </Button>
            </Grid>
          </Grid>
        </form>
      </>
    );
  }

  // Join room mode - allows entering room code
  return (
    <>
      <Typography variant="h5" className={classes.gutterBottom}>
        Join a Room
      </Typography>
      <Typography variant="body1" className={classes.gutterBottom}>
        Enter the 9-character room code to join
      </Typography>

      <form onSubmit={handleSubmit}>
        <div className={classes.inputContainer}>
          <div className={classes.textFieldContainer}>
            <InputLabel shrink htmlFor="input-room-code">
              Room Code
            </InputLabel>
            <TextField
              autoCapitalize="characters"
              id="input-room-code"
              variant="outlined"
              fullWidth
              size="small"
              value={roomName}
              onChange={handleRoomNameChange}
              placeholder="Enter 9-character code"
              inputProps={{ maxLength: 9, style: { textTransform: 'uppercase' } }}
            />
          </div>
        </div>

        <Grid container justifyContent="space-between" spacing={2}>
          <Grid item>
            <Button variant="outlined" onClick={handleBack}>
              Back
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              type="submit"
              color="primary"
              disabled={roomName.length !== 9}
              className={classes.continueButton}
            >
              Join Room
            </Button>
          </Grid>
        </Grid>
      </form>
    </>
  );
}
