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

  useEffect(() => {
    if (!room) {
      return;
    }

    const handleTranscription = (transcriptionData: any) => {
      const transcriptionEvent: TranscriptionEvent = {
        participant: transcriptionData.participant?.identity || 'Unknown',
        transcription: transcriptionData.transcription,
        timestamp: new Date(),
      };

      console.log(`${transcriptionEvent.participant}: ${transcriptionEvent.transcription}`);
      console.log(transcriptionData);

      setTranscriptions(prevTranscriptions => [...prevTranscriptions, transcriptionEvent]);
    };

    room.on('transcription', handleTranscription);

    return () => {
      room.off('transcription', handleTranscription);
    };
  }, [room]);

  useEffect(() => {
    const setupRealtimeChannel = async () => {
      await supabase.realtime.setAuth(); // Needed for Realtime Authorization
      const changes = supabase
        .channel(`participant_sid`, {
          config: { private: true },
        })
        .on('broadcast', { event: 'INSERT' }, (payload) => console.log(payload))
        .on('broadcast', { event: 'UPDATE' }, (payload) => console.log(payload))
        .on('broadcast', { event: 'DELETE' }, (payload) => console.log(payload))
        .subscribe();

      return changes;
    };

    const channel = setupRealtimeChannel();

    return () => {
      channel.then(ch => ch.unsubscribe());
    };
  }, []);

  const clearTranscriptions = () => {
    setTranscriptions([]);
  };

  return { transcriptions, clearTranscriptions };
}
