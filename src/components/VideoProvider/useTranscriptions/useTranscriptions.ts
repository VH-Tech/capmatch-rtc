import { useEffect, useState } from 'react';
import { Room } from 'twilio-video';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface TranscriptionEvent {
  participant: string;
  transcription: string;
  timestamp: Date;
}

export default function useTranscriptions(room: Room | null) {
  const [transcriptions, setTranscriptions] = useState<TranscriptionEvent[]>([]);
  const [participantNameMap, setParticipantNameMap] = useState<Record<string, string>>({});

  // Fetch participant name mappings when room is available
  useEffect(() => {
    if (!room) {
      return;
    }

    const fetchParticipantMappings = async () => {
      try {
        const { data, error } = await supabase
          .from('active_participants')
          .select('participant_sid, participant_identity')
          .eq('room_name', room.name);

        if (error) {
          console.error('Error fetching participant mappings:', error);
          return;
        }

        if (data) {
          const mappings: Record<string, string> = {};
          data.forEach((row: any) => {
            mappings[row.participant_sid] = row.participant_identity;
          });
          setParticipantNameMap(mappings);
        }
      } catch (error) {
        console.error('Error fetching participant mappings:', error);
      }
    };

    // Fetch immediately, then also fetch again after 5 seconds to catch any late arrivals
    fetchParticipantMappings();
    const timeoutId = setTimeout(() => {
      fetchParticipantMappings();
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [room]);

  useEffect(() => {
    if (!room) {
      return;
    }

    const handleTranscription = (transcriptionData: any) => {
      const participantSid = transcriptionData.participant || 'Unknown';
      const participantName = participantNameMap[participantSid] || participantSid;

      const transcriptionEvent: TranscriptionEvent = {
        participant: participantName,
        transcription: transcriptionData.transcription,
        timestamp: new Date(),
      };
      console.log('Received transcription event:', transcriptionData);
      console.log(`${transcriptionEvent.participant}: ${transcriptionEvent.transcription}`);

      setTranscriptions(prevTranscriptions => [...prevTranscriptions, transcriptionEvent]);
    };

    room.on('transcription', handleTranscription);

    return () => {
      room.off('transcription', handleTranscription);
    };
  }, [room, participantNameMap]);

  // Listen for real-time updates to participant mappings
  useEffect(() => {
    if (!room) {
      return;
    }

    const setupRealtimeChannel = async () => {
      await supabase.realtime.setAuth(); // Needed for Realtime Authorization
      const changes = supabase
        .channel(`participant_sid`, {
          config: { private: true },
        })
        .on('broadcast', { event: 'INSERT' }, (payload) => {
          if (payload.payload?.record && payload.payload.record.room_name === room.name) {
            const newParticipant = payload.payload.record;
            setParticipantNameMap((prevMap) => ({
              ...prevMap,
              [newParticipant.participant_sid]: newParticipant.participant_identity,
            }));
          }
        })
        .on('broadcast', { event: 'UPDATE' }, (payload) => console.log(payload))
        .on('broadcast', { event: 'DELETE' }, (payload) => console.log(payload))
        .subscribe();

      return changes;
    };

    const channel = setupRealtimeChannel();

    return () => {
      channel.then(ch => ch.unsubscribe());
    };
  }, [room]);

  const clearTranscriptions = () => {
    setTranscriptions([]);
  };

  return { transcriptions, clearTranscriptions };
}
