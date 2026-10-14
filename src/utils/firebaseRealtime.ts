import { FIREBASE_DB_URL } from "@/constants/firebaseConfig";
import { GameState, ClientAction } from "@/types/game";

// Generic JSON fetch helper
async function fbFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
  const url = `${FIREBASE_DB_URL}${endpoint}.json`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    if (!res.ok) {
      console.warn(`Firebase fetch failed for ${endpoint}:`, res.status, res.statusText);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error(`Firebase network error on ${endpoint}:`, err);
    return null;
  }
}

// 1. Room Meta
export async function setRoomMeta(roomCode: string, meta: Record<string, any>): Promise<void> {
  await fbFetch(`/rooms/${roomCode}/meta`, {
    method: "PUT",
    body: JSON.stringify(meta),
  });
}

export async function getRoomMeta(roomCode: string): Promise<Record<string, any> | null> {
  return await fbFetch<Record<string, any>>(`/rooms/${roomCode}/meta`);
}

export async function deleteRoom(roomCode: string): Promise<void> {
  await fbFetch(`/rooms/${roomCode}`, {
    method: "DELETE",
  });
}

// 2. Player State (Sanitized per player)
export async function setPlayerState(
  roomCode: string,
  playerId: string,
  state: GameState
): Promise<void> {
  await fbFetch(`/rooms/${roomCode}/playerStates/${playerId}`, {
    method: "PUT",
    body: JSON.stringify(state),
  });
}

export async function getPlayerState(
  roomCode: string,
  playerId: string
): Promise<GameState | null> {
  return await fbFetch<GameState>(`/rooms/${roomCode}/playerStates/${playerId}`);
}

// Subscribes a player to their state using EventSource with fallback polling
export function subscribeToPlayerState(
  roomCode: string,
  playerId: string,
  onState: (state: GameState) => void,
  onRoomClosed?: () => void
): () => void {
  let isClosed = false;
  let es: EventSource | null = null;

  const url = `${FIREBASE_DB_URL}/rooms/${roomCode}/playerStates/${playerId}.json`;

  const connectSSE = () => {
    if (isClosed) return;
    try {
      es = new EventSource(url);

      const handleEvent = (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed && parsed.path === "/" && parsed.data) {
            onState(parsed.data as GameState);
          } else if (parsed && parsed.path === "/" && parsed.data === null) {
            // State deleted or room closed
            onRoomClosed?.();
          }
        } catch (err) {
          console.warn("Error parsing state SSE data:", err);
        }
      };

      es.addEventListener("put", handleEvent);
      es.addEventListener("patch", handleEvent);

      es.onerror = () => {
        // EventSource will auto-reconnect, but if state was deleted, check meta
        if (!isClosed) {
          getRoomMeta(roomCode).then((meta) => {
            if (!meta && !isClosed) {
              onRoomClosed?.();
            }
          });
        }
      };
    } catch (err) {
      console.warn("EventSource init failed, relying on polling:", err);
    }
  };

  connectSSE();

  // Periodic fallback poll (every 2.5s) to guarantee updates if SSE connection sleeps
  const pollInterval = setInterval(async () => {
    if (isClosed) return;
    const state = await getPlayerState(roomCode, playerId);
    if (state && !isClosed) {
      onState(state);
    } else if (!state && !isClosed) {
      const meta = await getRoomMeta(roomCode);
      if (!meta && !isClosed) {
        onRoomClosed?.();
      }
    }
  }, 2500);

  return () => {
    isClosed = true;
    clearInterval(pollInterval);
    if (es) {
      es.close();
      es = null;
    }
  };
}

// 3. Join Requests
export async function sendJoinRequest(
  roomCode: string,
  player: { id: string; name: string; avatarIndex: number }
): Promise<void> {
  await fbFetch(`/rooms/${roomCode}/joinRequests/${player.id}`, {
    method: "PUT",
    body: JSON.stringify({
      ...player,
      timestamp: Date.now(),
    }),
  });
}

export async function deleteJoinRequest(roomCode: string, playerId: string): Promise<void> {
  await fbFetch(`/rooms/${roomCode}/joinRequests/${playerId}`, {
    method: "DELETE",
  });
}

export async function getJoinRequests(
  roomCode: string
): Promise<Record<string, { id: string; name: string; avatarIndex: number; timestamp: number }> | null> {
  return await fbFetch(`/rooms/${roomCode}/joinRequests`);
}

// 4. Action Queue
export async function pushAction(roomCode: string, action: ClientAction): Promise<string | null> {
  const res = await fbFetch<{ name: string }>(`/rooms/${roomCode}/actions`, {
    method: "POST",
    body: JSON.stringify({
      ...action,
      _timestamp: Date.now(),
    }),
  });
  return res ? res.name : null;
}

export async function getActions(
  roomCode: string
): Promise<Record<string, ClientAction & { _timestamp?: number }> | null> {
  return await fbFetch(`/rooms/${roomCode}/actions`);
}

export async function deleteAction(roomCode: string, actionKey: string): Promise<void> {
  await fbFetch(`/rooms/${roomCode}/actions/${actionKey}`, {
    method: "DELETE",
  });
}

// 5. Heartbeats & Presence
export async function sendHeartbeat(roomCode: string, playerId: string): Promise<void> {
  await fbFetch(`/rooms/${roomCode}/heartbeats/${playerId}`, {
    method: "PUT",
    body: JSON.stringify(Date.now()),
  });
}

export async function removeHeartbeat(roomCode: string, playerId: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    // Attempt beacon for fast unload
    const url = `${FIREBASE_DB_URL}/rooms/${roomCode}/heartbeats/${playerId}.json`;
    navigator.sendBeacon(url, JSON.stringify(0));
  } else {
    await fbFetch(`/rooms/${roomCode}/heartbeats/${playerId}`, {
      method: "PUT",
      body: JSON.stringify(0),
    });
  }
}

export async function getHeartbeats(
  roomCode: string
): Promise<Record<string, number> | null> {
  return await fbFetch<Record<string, number>>(`/rooms/${roomCode}/heartbeats`);
}
