import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  makeStyles,
  Theme,
  CircularProgress,
  Button,
} from '@material-ui/core';
import { createClient } from '@supabase/supabase-js';
import { useAppState } from '../../state';
import { useHistory } from 'react-router-dom';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const useStyles = makeStyles((theme: Theme) => ({
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
    minHeight: '100vh',
    background: '#f5f5f5',
  },
  header: {
    marginBottom: theme.spacing(4),
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  card: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: theme.shadows[8],
      cursor: 'pointer',
    },
  },
  cardContent: {
    flexGrow: 1,
  },
  title: {
    marginBottom: theme.spacing(1),
    fontWeight: 600,
  },
  summary: {
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2),
  },
  date: {
    color: theme.palette.text.secondary,
    fontSize: '0.875rem',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '50vh',
  },
  emptyState: {
    textAlign: 'center',
    padding: theme.spacing(8),
  },
}));

interface Meeting {
  id: string;
  room_name: string;
  title: string;
  executive_summary: string;
  timestamp: string;
}

export default function MeetingsHistory() {
  const classes = useStyles();
  const history = useHistory();
  const { user } = useAppState();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMeetings = async () => {
      if (!user || !('email' in user) || !user.email) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('transcriptions')
          .select('id, room_name, title, executive_summary, timestamp')
          .eq('user_email', user.email)
          .order('timestamp', { ascending: false });

        if (error) {
          console.error('Error fetching meetings:', error);
          setMeetings([]);
        } else {
          // Group by room_name and get the latest entry for each room
          const uniqueMeetings = data.reduce((acc: Meeting[], current) => {
            const existing = acc.find(m => m.room_name === current.room_name);
            if (!existing) {
              acc.push(current);
            }
            return acc;
          }, []);
          setMeetings(uniqueMeetings);
        }
      } catch (error) {
        console.error('Error fetching meetings:', error);
        setMeetings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMeetings();
  }, [user]);

  const handleCardClick = (roomName: string) => {
    // Navigate to meeting details or transcript view
    // For now, we'll just log it
    console.log('Clicked meeting:', roomName);
  };

  const handleBackHome = () => {
    history.push('/');
  };

  if (loading) {
    return (
      <div className={classes.loading}>
        <CircularProgress />
      </div>
    );
  }

  return (
    <Container className={classes.container} maxWidth="lg">
      <div className={classes.header}>
        <Typography variant="h4" component="h1">
          Meeting History
        </Typography>
        <Button variant="outlined" color="primary" onClick={handleBackHome}>
          Back to Home
        </Button>
      </div>

      {meetings.length === 0 ? (
        <div className={classes.emptyState}>
          <Typography variant="h6" gutterBottom>
            No meetings found
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Your past meetings will appear here once you've participated in video calls.
          </Typography>
        </div>
      ) : (
        <Grid container spacing={3}>
          {meetings.map((meeting) => (
            <Grid item xs={12} sm={6} md={4} key={meeting.id}>
              <Card className={classes.card} onClick={() => handleCardClick(meeting.room_name)}>
                <CardContent className={classes.cardContent}>
                  <Typography variant="h6" className={classes.title}>
                    {meeting.title || `Meeting in ${meeting.room_name}`}
                  </Typography>
                  <Typography variant="body2" className={classes.summary}>
                    {meeting.executive_summary || 'No summary available'}
                  </Typography>
                  <Typography variant="caption" className={classes.date}>
                    {new Date(meeting.timestamp).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
