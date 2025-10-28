import { useEffect, useRef, useState, useCallback } from 'react';
import { Room } from 'twilio-video';
import { createClient } from '@supabase/supabase-js';
import { useAppState } from '../../state';

/**
 * React hook for Twilio Real-Time Transcriptions.
 *
 * See official docs:
 * - Overview: https://www.twilio.com/docs/video/api/real-time-transcriptions
 * - Console defaults & REST configuration: https://www.twilio.com/docs/video/api/real-time-transcriptions#enabling-real-time-transcriptions
 * - JS SDK usage: https://www.twilio.com/docs/video/api/real-time-transcriptions#receiving-transcriptions-in-the-js-sdk
 *
 * Usage:
 *   const { lines, live, clear } = useTranscriptions(room);
 *   room.on('transcription', event => ...);
 *   Pass receiveTranscriptions: true in ConnectOptions.
 */

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const STABILITY_THRESHOLD = 0.9;

export type TranscriptionEvent = {
  participant: string; // display name or SID
  transcription: string; // text content
  partial_results?: boolean; // true if partial
  stability?: number; // present on partials; not present on finals
  sequence_number?: number;
  track?: string;
  timestamp?: string;
  absolute_time?: string; // ISO 8601
  language_code?: string;
};

export type TranscriptionLine = {
  text: string;
  participant: string;
  time: number;
};

type UseTranscriptionsResult = {
  lines: TranscriptionLine[];
  live?: TranscriptionLine | null;
  push: (event: TranscriptionEvent) => void;
  clear: () => void;
};

const MAX_TOTAL_LINES = 3;
const MAX_LINES_PER_PARTICIPANT = 2;

/**
 * Format participant display string - will be replaced by actual name from mapping.
 */
function formatParticipant(participant: string, nameMap: Record<string, string>): string {
  if (!participant) return '';
  // Check if we have a mapping for this participant SID
  if (nameMap[participant]) {
    return nameMap[participant];
  }
  // Fallback to truncated SID if no mapping found
  if (/^PA[a-zA-Z0-9]+$/.test(participant) && participant.length > 4) {
    return `PA..${participant.slice(-4)}`;
  }
  return participant;
}

export function useTranscriptions(room: Room | null, opts: { enabled?: boolean } = {}): UseTranscriptionsResult {
  const enabled = opts.enabled !== undefined ? opts.enabled : true;
  const { user } = useAppState();
  const [lines, setLines] = useState<TranscriptionLine[]>([]);
  const [live, setLive] = useState<TranscriptionLine | null>(null);
  const liveRef = useRef<{ [sid: string]: TranscriptionLine }>({});
  const [participantNameMap, setParticipantNameMap] = useState<Record<string, string>>({});

  // Helper function to save transcription to Supabase
  const saveTranscriptionToSupabase = useCallback(async (
    participantSid: string,
    participantName: string,
    text: string,
    roomName: string,
    timestamp: number,
    userEmail: string | undefined
  ) => {
    try {
      // Format timestamp as readable string
      const timestampStr = new Date(timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      // Format the new transcript line
      const newLine = `${participantName} [${timestampStr}]: ${text}`;

      // First, check if a record exists for this participant in this room
      const { data: existingData, error: fetchError } = await supabase
        .from('transcriptions')
        .select('transcript')
        .eq('participant_sid', participantSid)
        .eq('room_name', roomName)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected for first transcript
        console.error('Error fetching existing transcription:', fetchError);
        return;
      }

      if (existingData) {
        // Update existing record by appending new line
        const updatedTranscript = existingData.transcript + '\n' + newLine;

        const { error: updateError } = await supabase
          .from('transcriptions')
          .update({
            transcript: updatedTranscript,
            timestamp: new Date(timestamp).toISOString(), // Update to latest timestamp
          })
          .eq('participant_sid', participantSid)
          .eq('room_name', roomName);

        if (updateError) {
          console.error('Error updating transcription:', updateError);
        }
      } else {
        // Create new record
        const { error: insertError } = await supabase
          .from('transcriptions')
          .insert({
            participant_sid: participantSid,
            room_name: roomName,
            transcript: newLine,
            timestamp: new Date(timestamp).toISOString(),
            user_email: userEmail || null,
          });

        if (insertError) {
          console.error('Error inserting transcription:', insertError);
        }
      }
    } catch (error) {
      console.error('Error saving transcription to Supabase:', error);
    }
  }, []);

  const clear = useCallback(() => {
    setLines([]);
    setLive(null);
    liveRef.current = {};
  }, []);

  const push = useCallback(
    (event: TranscriptionEvent) => {
      if (!enabled || !room) return;
      const participantSid = event.participant; // Keep original SID
      const participant = formatParticipant(participantSid, participantNameMap);
      const text = event.transcription;
      const time = event.absolute_time ? Date.parse(event.absolute_time) : Date.now();

      if (event.partial_results) {
        // Drop low-stability partials: only show partials with stability >= threshold.
        // Finals are always committed regardless of stability.
        const stab = typeof event.stability === 'number' ? event.stability : 0;
        if (stab < STABILITY_THRESHOLD) {
          // Ignore low-stability partials; keep showing the last acceptable partial
          return;
        }
        // Store/update live partial for participant
        const liveLine: TranscriptionLine = { text, participant, time };
        liveRef.current[participant] = liveLine;
        setLive(liveLine);
      } else {
        // Final result: move from live to committed
        const finalLine: TranscriptionLine = { text, participant, time };

        // Save final transcription to Supabase
        const userEmail = user && 'email' in user ? user.email || undefined : undefined;
        saveTranscriptionToSupabase(participantSid, participant, text, room.name, time, userEmail);

        setLines(prev => {
          // Add new line
          const updated = [...prev, finalLine];

          // Enforce max per participant
          const perParticipant: { [sid: string]: TranscriptionLine[] } = {};
          updated.forEach(line => {
            if (!perParticipant[line.participant]) perParticipant[line.participant] = [];
            perParticipant[line.participant].push(line);
          });

          // Remove oldest lines if any participant exceeds MAX_LINES_PER_PARTICIPANT
          let filtered = updated;
          Object.keys(perParticipant).forEach(sid => {
            const arr = perParticipant[sid];
            if (arr.length > MAX_LINES_PER_PARTICIPANT) {
              // Remove oldest for this participant
              const toRemove = arr.length - MAX_LINES_PER_PARTICIPANT;
              let count = 0;
              filtered = filtered.filter(line => {
                if (line.participant === sid && count < toRemove) {
                  count++;
                  return false;
                }
                return true;
              });
            }
          });

          // Enforce max total lines
          if (filtered.length > MAX_TOTAL_LINES) {
            filtered = filtered.slice(filtered.length - MAX_TOTAL_LINES);
          }

          return filtered;
        });
        // Remove live partial for participant
        delete liveRef.current[participant];
        setLive(null);
      }
    },
    [enabled, participantNameMap, room, saveTranscriptionToSupabase]
  );

  // Fetch participant name mappings from Supabase
  useEffect(() => {
    if (!room || !enabled) {
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

    // Fetch immediately, then also fetch again after 5 seconds
    fetchParticipantMappings();
    const timeoutId = setTimeout(() => {
      fetchParticipantMappings();
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [room, enabled]);

  // Listen for real-time updates to participant mappings
  useEffect(() => {
    if (!room || !enabled) {
      return;
    }

    const setupRealtimeChannel = async () => {
      await supabase.realtime.setAuth();
      const changes = supabase
        .channel(`participant_sid_overlay`, {
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
  }, [room, enabled]);

  useEffect(() => {
    if (!room || !enabled) {
      clear();
      return;
    }

    const handler = (event: TranscriptionEvent) => {
      if (!enabled) return;
      push(event);
    };

    room.on('transcription', handler);

    // Clear on disconnect
    const disconnectHandler = () => {
      clear();
    };
    room.on('disconnected', disconnectHandler);

    return () => {
      room.off('transcription', handler);
      room.off('disconnected', disconnectHandler);
      clear();
    };
  }, [room, push, clear, enabled]);

  if (!room) {
    return { lines: [], push: () => {}, clear: () => {} };
  }

  return { lines, live, push, clear };
}
