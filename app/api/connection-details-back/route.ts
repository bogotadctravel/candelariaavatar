import { NextResponse } from 'next/server';
import { AccessToken, type AccessTokenOptions, type VideoGrant } from 'livekit-server-sdk';
import { RoomAgentDispatch, RoomConfiguration } from '@livekit/protocol';

type ConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
  metadata?: Record<string, null>;
};

// NOTE: you are expected to define the following environment variables in `.env.local`:
const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

// don't cache the results
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    if (LIVEKIT_URL === undefined) {
      throw new Error('LIVEKIT_URL is not defined');
    }
    if (API_KEY === undefined) {
      throw new Error('LIVEKIT_API_KEY is not defined');
    }
    if (API_SECRET === undefined) {
      throw new Error('LIVEKIT_API_SECRET is not defined');
    }
    // Parse agent configuration from request body
    // const body = await req.json();
    // console.log('body nueva: ', body);
    //const agentName: string = body?.room_config?.agents?.[0]?.agent_name;
    const agentName = `avatar-idt-candelaria`;
    console.log('agentName: ', agentName);
    //codigo propio
    const { searchParams } = new URL(req.url);
    const user_id: string | null = searchParams.get('user_id');
    const user_name: string | null = searchParams.get('user_name');
    const user_phone: string | null = searchParams.get('user_phone');
    console.log(`user_id:${user_id}`);
    console.log(`user_name:${user_name}`);
    console.log(`user_phone:${user_phone}`);
    // Generate participant token
    const participantName = 'user';
    const participantIdentity = `voice_assistant_user_${Math.floor(Math.random() * 10_000)}`;
    const roomName = `voice_assistant_room_${Math.floor(Math.random() * 10_000)}`;
    //const roomName = user_id !== '' ? user_id : `voice_assistant_room_${Math.floor(Math.random() * 10_000)}`;
    console.log(`roomName:${roomName}`);
    const participantToken = await createParticipantToken(
      { identity: participantIdentity, name: participantName },
      roomName,
      agentName,
      user_id,
      user_name,
      user_phone
    );

    // Return connection details
    const data: ConnectionDetails = {
      serverUrl: LIVEKIT_URL,
      roomName,
      participantToken: participantToken,
      participantName,
    };
    const headers = new Headers({
      'Cache-Control': 'no-store',
    });
    return NextResponse.json(data, { headers });
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
      return new NextResponse(error.message, { status: 500 });
    }
  }
}

export async function GET() {
  console.log('GET HIT');
  return NextResponse.json({ ok: true });
}

function createParticipantToken(
  userInfo: AccessTokenOptions,
  roomName: string,
  agentName?: string,
  user_id?: string | null,
  user_name?: string | null,
  user_phone?: string | null
): Promise<string> {
  const at = new AccessToken(API_KEY, API_SECRET, {
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
          agentName: agentName,
          metadata: `{"user_id": "${user_id}","user_name": "${user_name}","user_phone": "${user_phone}"}`,
        }),
      ],
    });
  }

  return at.toJwt();
}
