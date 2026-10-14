import { FIREBASE_DB_URL } from "@/constants/firebaseConfig";
import { GameState, ClientAction, Player } from "@/types/game";

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

// 1. Core Room State
export async function setRoomState(roomCode: string, state: GameState): Promise<void> {
  await fbFetch(`/rooms/${roomCode}/state`, {
    method: "PUT",
    body: JSON.stringify(state),
  });
}

export async function getRoomState(roomCode: string): Promise<GameState | null> {
  return await fbFetch<GameState>(`/rooms/${roomCode}/state`);
}

export async function updateRoomPlayers(roomCode: string, players: Player[]): Promise<void> {
  await fbFetch(`/rooms/${roomCode}/state/players`, {
    method: "PUT",
    body: JSON.stringify(players),
  });
}

export async function deleteRoom(roomCode: string): Promise<void> {
  await fbFetch(`/rooms/${roomCode}`, {
    method: "DELETE",
  });
}

// Subscribes to full Room State using native EventSource with fallback polling
export function subscribeToRoomState(
  roomCode: string,
  onState: (state: GameState) => void,
  onRoomClosed?: () => void
): () => void {
  let isClosed = false;
  let es: EventSource | null = null;
  let hasReceivedInitialState = false;

  const url = `${FIREBASE_DB_URL}/rooms/${roomCode}/state.json`;

  const connectSSE = () => {
    if (isClosed) return;
    try {
      es = new EventSource(url);

      const handleEvent = (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed && parsed.path === "/" && parsed.data) {
            hasReceivedInitialState = true;
            onState(parsed.data as GameState);
          } else if (parsed && parsed.path === "/" && parsed.data === null) {
            // Only trigger room closed if we previously had state
            if (hasReceivedInitialState) {
              onRoomClosed?.();
            }
          }
        } catch (err) {
          console.warn("Error parsing state SSE data:", err);
        }
      };

      es.addEventListener("put", handleEvent);
      es.addEventListener("patch", handleEvent);

      es.onerror = () => {
        if (!isClosed && hasReceivedInitialState) {
          getRoomState(roomCode).then((st) => {
            if (!st && !isClosed) onRoomClosed?.();
          });
        }
      };
    } catch (err) {
      console.warn("EventSource init failed, relying on polling:", err);
    }
  };

  connectSSE();

  // Periodic poll to ensure background tabs stay 100% updated
  const pollInterval = setInterval(async () => {
    if (isClosed) return;
    const state = await getRoomState(roomCode);
    if (state && !isClosed) {
      hasReceivedInitialState = true;
      onState(state);
    } else if (!state && !isClosed && hasReceivedInitialState) {
      onRoomClosed?.();
    }
  }, 2000);

  return () => {
    isClosed = true;
    clearInterval(pollInterval);
    if (es) {
      es.close();
      es = null;
    }
  };
}

// 2. Secret Roles & Night Vision
export async function setPlayerSecret(
  roomCode: string,
  playerId: string,
  secret: { character: any; vision: any }
): Promise<void> {
  await fbFetch(`/rooms/${roomCode}/secrets/${playerId}`, {
    method: "PUT",
    body: JSON.stringify(secret),
  });
}

export async function getPlayerSecret(
  roomCode: string,
  playerId: string
): Promise<{ character: any; vision: any } | null> {
  return await fbFetch<{ character: any; vision: any }>(`/rooms/${roomCode}/secrets/${playerId}`);
}

// 3. Action Queue
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

// 4. Heartbeats & Presence
export async function sendHeartbeat(roomCode: string, playerId: string): Promise<void> {
  await fbFetch(`/rooms/${roomCode}/heartbeats/${playerId}`, {
    method: "PUT",
    body: JSON.stringify(Date.now()),
  });
}

export async function removeHeartbeat(roomCode: string, playerId: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
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
