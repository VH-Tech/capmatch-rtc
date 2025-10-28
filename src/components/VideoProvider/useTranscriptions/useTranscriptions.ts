import { useEffect, useState } from 'react';
import { Room } from 'twilio-video';
import { supabase } from '../../../utils/supabaseClient';

export interface TranscriptionEvent {
  participant: string;
  transcription: string;
  timestamp: Date;
}

export default function useTranscriptions(room: Room | null) {
  const [transcriptions, setTranscriptions] = useState<TranscriptionEvent[]>([]);
  const [participantNameMap, setParticipantNameMap] = useState<Record<string, string>>({});

  // Fetch participant name mappings when room is available (with polling)
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
          
          // Only update state if mappings actually changed to avoid re-renders
          setParticipantNameMap(prev => {
            const prevKeys = Object.keys(prev);
            const nextKeys = Object.keys(mappings);
            if (prevKeys.length !== nextKeys.length) return mappings;
            for (const k of nextKeys) {
              if (prev[k] !== mappings[k]) return mappings;
            }
            return prev; // unchanged
          });

          console.log('Fetched participant mappings:', mappings);
        }
      } catch (error) {
        console.error('Error fetching participant mappings:', error);
      }
    };

    // Polling interval (ms), default 5000. Can be overridden via env.
    const pollMs = Number(process.env.REACT_APP_PARTICIPANT_POLL_MS) || 5000;
    // Fetch immediately, then poll
    fetchParticipantMappings();
    const intervalId = setInterval(fetchParticipantMappings, pollMs);

    return () => clearInterval(intervalId);
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
