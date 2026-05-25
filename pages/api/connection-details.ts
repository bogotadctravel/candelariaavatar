import type { NextApiRequest, NextApiResponse } from 'next';
import { AccessToken, type AccessTokenOptions, type VideoGrant } from 'livekit-server-sdk';
import { RoomAgentDispatch, RoomConfiguration } from '@livekit/protocol';

type ConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
};

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ConnectionDetails | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!LIVEKIT_URL) throw new Error('LIVEKIT_URL is not defined');
    if (!API_KEY) throw new Error('LIVEKIT_API_KEY is not defined');
    if (!API_SECRET) throw new Error('LIVEKIT_API_SECRET is not defined');

    const agentName = 'avatar-idt-candelaria';

    const { user_id, user_name, user_phone, lang } = req.query;

    console.log(`user_ids:${user_id}`);
    console.log(`user_names:${user_name}`);
    console.log(`user_phones:${user_phone}`);
    console.log(`lang:${lang}`);

    const participantName = 'user';
    const participantIdentity = `voice_assistant_user_${Math.floor(Math.random() * 10_000)}`;
    const roomName = `voice_assistant_room_${Math.floor(Math.random() * 10_000)}`;

    const participantToken = await createParticipantToken(
      { identity: participantIdentity, name: participantName },
      roomName,
      agentName,
      user_id as string | undefined,
      user_name as string | undefined,
      user_phone as string | undefined,
      lang as string | undefined
    );

    return res.status(200).json({
      serverUrl: LIVEKIT_URL,
      roomName,
      participantToken,
      participantName,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: (error as Error).message });
  }
}

function createParticipantToken(
  userInfo: AccessTokenOptions,
  roomName: string,
  agentName?: string,
  user_id?: string,
  user_name?: string,
  user_phone?: string,
  lang?: string
): Promise<string> {
  const at = new AccessToken(API_KEY!, API_SECRET!, {
    ...userInfo,
    ttl: '12h',
  });

  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  };

  at.addGrant(grant);

  if (agentName) {
    at.roomConfig = new RoomConfiguration({
      agents: [
        new RoomAgentDispatch({
          agentName,
          metadata: JSON.stringify({
            user_id,
            user_name,
            user_phone,
            lang,
          }),
        }),
      ],
    });
  }

  return at.toJwt();
}
