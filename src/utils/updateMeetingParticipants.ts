import { supabase } from './supabaseClient';

/**
 * Adds a user's email to the participants array of a meeting if not already present
 * @param roomName - The primary key of the meeting (room_name)
 * @param userEmail - The email address of the user to add
 * @returns Promise that resolves when the update is complete
 */
export async function updateMeetingParticipants(roomName: string, userEmail: string): Promise<void> {
  console.log('[updateMeetingParticipants] Called with:', { roomName, userEmail });
  
  if (!roomName || !userEmail) {
    console.warn('[updateMeetingParticipants] Room name and user email are required to update meeting participants');
    return;
  }

  try {
    console.log('[updateMeetingParticipants] Fetching meeting record for room:', roomName);
    
    // First, fetch the current meeting record
    const { data: meeting, error: fetchError } = await supabase
      .from('meetings')
      .select('participants')
      .eq('room_name', roomName)
      .single();

    if (fetchError) {
      console.error('[updateMeetingParticipants] Error fetching meeting:', fetchError);
      return;
    }

    console.log('[updateMeetingParticipants] Fetched meeting data:', meeting);

    // Check if the email is already in the participants array
    const currentParticipants = meeting?.participants || [];
    console.log('[updateMeetingParticipants] Current participants:', currentParticipants);
    
    if (!currentParticipants.includes(userEmail)) {
      console.log('[updateMeetingParticipants] Email not found in participants, adding:', userEmail);
      
      // Add the email to the participants array
      const updatedParticipants = [...currentParticipants, userEmail];
      console.log('[updateMeetingParticipants] Updated participants array:', updatedParticipants);
      
      const { error: updateError } = await supabase
        .from('meetings')
        .update({ participants: updatedParticipants })
        .eq('room_name', roomName);

      if (updateError) {
        console.error('[updateMeetingParticipants] Error updating meeting participants:', updateError);
      } else {
        console.log(`[updateMeetingParticipants] ✅ Successfully added ${userEmail} to meeting ${roomName}`);
      }
    } else {
      console.log(`[updateMeetingParticipants] ℹ️ ${userEmail} is already a participant in meeting ${roomName}`);
    }
  } catch (error) {
    console.error('[updateMeetingParticipants] Unexpected error:', error);
  }
}
