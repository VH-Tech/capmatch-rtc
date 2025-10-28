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
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
} from '@material-ui/core';
import {
  CheckCircleOutline,
  ErrorOutline,
  HelpOutline,
  FiberManualRecord,
  Person,
  Language,
  ArrowBack,
} from '@material-ui/icons';
import { createClient } from '@supabase/supabase-js';
import { useHistory, useParams } from 'react-router-dom';
import { useAppState } from '../../state';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const useStyles = makeStyles((theme: Theme) => ({
  background: {
    minHeight: '100vh',
    background: 'rgb(40, 42, 43)',
    display: 'flex',
    flexDirection: 'column',
  },
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
    flex: 1,
  },
  header: {
    marginBottom: theme.spacing(4),
    color: 'white',
  },
  backButton: {
    marginBottom: theme.spacing(2),
    color: 'white',
    borderColor: 'white',
    '&:hover': {
      borderColor: 'white',
      background: 'rgba(255, 255, 255, 0.1)',
    },
  },
  title: {
    fontWeight: 700,
    marginBottom: theme.spacing(1),
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: theme.spacing(3),
  },
  section: {
    marginBottom: theme.spacing(3),
  },
  sectionTitle: {
    fontWeight: 600,
    marginBottom: theme.spacing(2),
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  card: {
    height: '100%',
    borderRadius: '8px',
  },
  executiveSummary: {
    fontSize: '1.1rem',
    lineHeight: 1.8,
    color: theme.palette.text.primary,
  },
  listItem: {
    paddingLeft: 0,
  },
  chip: {
    margin: theme.spacing(0.5),
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '50vh',
    '& .MuiCircularProgress-root': {
      color: 'white',
    },
  },
  metaInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginTop: theme.spacing(2),
    color: 'white',
    '& .MuiSvgIcon-root': {
      color: 'white',
    },
  },
  divider: {
    margin: theme.spacing(3, 0),
  },
  transcript: {
    background: '#f5f5f5',
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    fontFamily: 'monospace',
    fontSize: '0.9rem',
    whiteSpace: 'pre-wrap',
    maxHeight: '400px',
    overflowY: 'auto',
  },
  emptyState: {
    textAlign: 'center',
    padding: theme.spacing(8),
    background: 'white',
    borderRadius: '8px',
    margin: theme.spacing(4, 0),
  },
}));

interface MeetingSummaryData {
  title: string;
  executive_summary: string;
  key_points: string[];
  important_numbers: string[];
  action_items: string[];
  questions_raised: string[];
  open_questions: string[];
  participants: string;
  transcript_language: string;
}

interface MeetingData {
  room_name: string;
  transcript: string;
  timestamp: string;
  summary: MeetingSummaryData | null;
}

export default function MeetingSummary() {
  const classes = useStyles();
  const history = useHistory();
  const { user } = useAppState();
  const { roomName } = useParams<{ roomName: string }>();
  const [meeting, setMeeting] = useState<MeetingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMeetingSummary = async () => {
      if (!roomName) {
        setLoading(false);
        return;
      }

      if (!user || !('email' in user) || !user.email) {
        console.error('User email not available');
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching meeting summary for room:', roomName, 'user:', user.email);

        const { data, error } = await supabase
          .from('transcriptions')
          .select('room_name, transcript, timestamp, summary')
          .eq('room_name', roomName)
          .eq('user_email', user.email)
          .single();

        console.log('Supabase response:', { data, error });

        if (error) {
          console.error('Error fetching meeting summary:', error);
          setMeeting(null);
        } else if (data) {
          console.log('Raw summary data:', data.summary);
          console.log('Summary type:', typeof data.summary);

          // Parse the summary field if it's a JSON string
          let parsedSummary = null;
          if (data.summary) {
            try {
              parsedSummary = typeof data.summary === 'string'
                ? JSON.parse(data.summary)
                : data.summary;
              console.log('Parsed summary:', parsedSummary);
            } catch (parseError) {
              console.error('Error parsing summary JSON:', parseError);
              console.error('Raw summary value:', data.summary);
              parsedSummary = null;
            }
          }

          const meetingData = {
            ...data,
            summary: parsedSummary,
          };

          console.log('Final meeting data:', meetingData);
          setMeeting(meetingData);
        } else {
          console.log('No data returned from Supabase');
          setMeeting(null);
        }
      } catch (error) {
        console.error('Error fetching meeting summary:', error);
        setMeeting(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMeetingSummary();
  }, [roomName, user]);

  const handleBack = () => {
    history.push('/meetings');
  };

  if (loading) {
    return (
      <div className={classes.background}>
        <div className={classes.loading}>
          <CircularProgress />
        </div>
      </div>
    );
  }

  if (!meeting || !meeting.summary) {
    return (
      <div className={classes.background}>
        <Container className={classes.container} maxWidth="lg">
          <Button
            startIcon={<ArrowBack />}
            onClick={handleBack}
            className={classes.backButton}
            variant="outlined"
          >
            Back to Meetings
          </Button>
          <div className={classes.emptyState}>
            <Typography variant="h5">Meeting summary not found</Typography>
          </div>
        </Container>
      </div>
    );
  }

  const summary = meeting.summary;

  return (
    <div className={classes.background}>
      <Container className={classes.container} maxWidth="lg">
        <Button
          startIcon={<ArrowBack />}
          onClick={handleBack}
          className={classes.backButton}
          variant="outlined"
        >
          Back to Meetings
        </Button>

        <div className={classes.header}>
          <Typography variant="h3" className={classes.title}>
            {summary.title}
          </Typography>
          <Typography variant="subtitle1" className={classes.subtitle}>
            Room: {meeting.room_name} • {new Date(meeting.timestamp).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Typography>

          <div className={classes.metaInfo}>
            <Language fontSize="small" />
            <Typography variant="body2">
              Language: {summary.transcript_language}
            </Typography>
            <Person fontSize="small" style={{ marginLeft: 16 }} />
            <Typography variant="body2">
              Participants: {summary.participants}
            </Typography>
          </div>
        </div>

      <Grid container spacing={3}>
        {/* Executive Summary */}
        <Grid item xs={12}>
          <Card className={classes.card}>
            <CardContent>
              <Typography variant="h5" className={classes.sectionTitle}>
                Executive Summary
              </Typography>
              <Typography className={classes.executiveSummary}>
                {summary.executive_summary}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Key Points */}
        {summary.key_points && summary.key_points.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card className={classes.card}>
              <CardContent>
                <Typography variant="h6" className={classes.sectionTitle}>
                  <FiberManualRecord fontSize="small" color="primary" />
                  Key Points
                </Typography>
                <List>
                  {summary.key_points.map((point, index) => (
                    <ListItem key={index} className={classes.listItem}>
                      <ListItemIcon>
                        <FiberManualRecord fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={point} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Important Numbers */}
        {summary.important_numbers && summary.important_numbers.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card className={classes.card}>
              <CardContent>
                <Typography variant="h6" className={classes.sectionTitle}>
                  Important Numbers
                </Typography>
                <List>
                  {summary.important_numbers.map((number, index) => (
                    <ListItem key={index} className={classes.listItem}>
                      <ListItemIcon>
                        <FiberManualRecord fontSize="small" color="secondary" />
                      </ListItemIcon>
                      <ListItemText primary={number} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Action Items */}
        {summary.action_items && summary.action_items.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card className={classes.card}>
              <CardContent>
                <Typography variant="h6" className={classes.sectionTitle}>
                  <CheckCircleOutline fontSize="small" color="action" />
                  Action Items
                </Typography>
                <List>
                  {summary.action_items.map((action, index) => (
                    <ListItem key={index} className={classes.listItem}>
                      <ListItemIcon>
                        <CheckCircleOutline fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={action} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Questions Raised */}
        {summary.questions_raised && summary.questions_raised.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card className={classes.card}>
              <CardContent>
                <Typography variant="h6" className={classes.sectionTitle}>
                  <HelpOutline fontSize="small" color="action" />
                  Questions Raised
                </Typography>
                <List>
                  {summary.questions_raised.map((question, index) => (
                    <ListItem key={index} className={classes.listItem}>
                      <ListItemIcon>
                        <HelpOutline fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={question} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Open Questions */}
        {summary.open_questions && summary.open_questions.length > 0 && (
          <Grid item xs={12}>
            <Card className={classes.card}>
              <CardContent>
                <Typography variant="h6" className={classes.sectionTitle}>
                  <ErrorOutline fontSize="small" color="error" />
                  Open Questions
                </Typography>
                <List>
                  {summary.open_questions.map((question, index) => (
                    <ListItem key={index} className={classes.listItem}>
                      <ListItemIcon>
                        <ErrorOutline fontSize="small" color="error" />
                      </ListItemIcon>
                      <ListItemText primary={question} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Full Transcript */}
        <Grid item xs={12}>
          <Card className={classes.card}>
            <CardContent>
              <Typography variant="h6" className={classes.sectionTitle}>
                Full Transcript
              </Typography>
              <Paper className={classes.transcript} elevation={0}>
                {meeting.transcript}
              </Paper>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      </Container>
    </div>
  );
}
