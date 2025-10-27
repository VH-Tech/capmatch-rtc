import { useEffect, useState } from 'react';
import { Room } from 'twilio-video';

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
      console.log(transcriptionEvent);

      setTranscriptions(prevTranscriptions => [...prevTranscriptions, transcriptionEvent]);
    };

    room.on('transcription', handleTranscription);

    return () => {
      room.off('transcription', handleTranscription);
    };
  }, [room]);

  const clearTranscriptions = () => {
    setTranscriptions([]);
  };

  return { transcriptions, clearTranscriptions };
}
