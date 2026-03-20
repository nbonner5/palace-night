import {
  createLobby,
  getLobby,
  getLobbyByCode,
  joinLobby,
  leaveLobby,
  setReady,
  canStartGame,
  listPublicLobbies,
  toLobbyInfo,
  swapSeats,
  clearAllLobbies,
} from '../../server/src/lobbyManager';

beforeEach(() => {
  clearAllLobbies();
});

describe('createLobby', () => {
  it('creates a lobby with host as first participant', () => {
    const lobby = createLobby('p1', 'Alice');

    expect(lobby.hostId).toBe('p1');
    expect(lobby.participants.size).toBe(1);
    const host = lobby.participants.get('p1');
    expect(host).toBeDefined();
    expect(host!.displayName).toBe('Alice');
    expect(host!.isHost).toBe(true);
    expect(host!.isReady).toBe(false);
    expect(host!.seatIndex).toBe(0);
  });

  it('generates a 6-char alphanumeric code', () => {
    const lobby = createLobby('p1', 'Alice');
    expect(lobby.code).toMatch(/^[A-Z2-9]{6}$/);
  });

  it('applies custom config', () => {
    const lobby = createLobby('p1', 'Alice', {
      maxPlayers: 6,
      isPrivate: true,
      password: 'secret',
    });

    expect(lobby.config.maxPlayers).toBe(6);
    expect(lobby.config.isPrivate).toBe(true);
    expect(lobby.config.password).toBe('secret');
    // Defaults preserved
    expect(lobby.config.deckCount).toBe(1);
    expect(lobby.config.includeJokers).toBe(true);
  });

  it('assigns unique codes to different lobbies', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const lobby = createLobby(`p${i}`, `Player ${i}`);
      codes.add(lobby.code);
    }
    expect(codes.size).toBe(20);
  });
});

describe('getLobby / getLobbyByCode', () => {
  it('retrieves lobby by id', () => {
    const lobby = createLobby('p1', 'Alice');
    expect(getLobby(lobby.id)).toBe(lobby);
  });

  it('retrieves lobby by code', () => {
    const lobby = createLobby('p1', 'Alice');
    expect(getLobbyByCode(lobby.code)).toBe(lobby);
  });

  it('code lookup is case-insensitive', () => {
    const lobby = createLobby('p1', 'Alice');
    expect(getLobbyByCode(lobby.code.toLowerCase())).toBe(lobby);
  });

  it('returns undefined for unknown id/code', () => {
    expect(getLobby('nonexistent')).toBeUndefined();
    expect(getLobbyByCode('ZZZZZZ')).toBeUndefined();
  });
});

describe('joinLobby', () => {
  it('adds a player to the lobby', () => {
    const lobby = createLobby('p1', 'Alice');
    const result = joinLobby(lobby.id, 'p2', 'Bob');

    expect(result.success).toBe(true);
    expect(lobby.participants.size).toBe(2);
    const bob = lobby.participants.get('p2');
    expect(bob!.displayName).toBe('Bob');
    expect(bob!.isHost).toBe(false);
    expect(bob!.seatIndex).toBe(1);
  });

  it('assigns sequential seat indices', () => {
    const lobby = createLobby('p1', 'Alice');
    joinLobby(lobby.id, 'p2', 'Bob');
    joinLobby(lobby.id, 'p3', 'Charlie');

    expect(lobby.participants.get('p1')!.seatIndex).toBe(0);
    expect(lobby.participants.get('p2')!.seatIndex).toBe(1);
    expect(lobby.participants.get('p3')!.seatIndex).toBe(2);
  });

  it('fills gaps in seat indices when players leave', () => {
    const lobby = createLobby('p1', 'Alice');
    joinLobby(lobby.id, 'p2', 'Bob');
    joinLobby(lobby.id, 'p3', 'Charlie');
    leaveLobby(lobby.id, 'p2'); // Frees seat 1
    joinLobby(lobby.id, 'p4', 'Dana');

    expect(lobby.participants.get('p4')!.seatIndex).toBe(1); // Reuses seat 1
  });

  it('rejects when lobby is full', () => {
    const lobby = createLobby('p1', 'Alice', { maxPlayers: 2 });
    joinLobby(lobby.id, 'p2', 'Bob');
    const result = joinLobby(lobby.id, 'p3', 'Charlie');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe('LOBBY_FULL');
    }
  });

  it('rejects when game is in progress', () => {
    const lobby = createLobby('p1', 'Alice');
    lobby.gameInProgress = true;
    const result = joinLobby(lobby.id, 'p2', 'Bob');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe('GAME_IN_PROGRESS');
    }
  });

  it('rejects wrong password for private lobby', () => {
    const lobby = createLobby('p1', 'Alice', { isPrivate: true, password: 'secret' });
    const result = joinLobby(lobby.id, 'p2', 'Bob', 'wrong');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe('LOBBY_WRONG_PASSWORD');
    }
  });

  it('accepts correct password for private lobby', () => {
    const lobby = createLobby('p1', 'Alice', { isPrivate: true, password: 'secret' });
    const result = joinLobby(lobby.id, 'p2', 'Bob', 'secret');

    expect(result.success).toBe(true);
    expect(lobby.participants.size).toBe(2);
  });

  it('returns success if player already in lobby', () => {
    const lobby = createLobby('p1', 'Alice');
    const result = joinLobby(lobby.id, 'p1', 'Alice');
    expect(result.success).toBe(true);
  });

  it('rejects for nonexistent lobby', () => {
    const result = joinLobby('fake', 'p1', 'Alice');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe('LOBBY_NOT_FOUND');
    }
  });
});

describe('leaveLobby', () => {
  it('removes a player', () => {
    const lobby = createLobby('p1', 'Alice');
    joinLobby(lobby.id, 'p2', 'Bob');
    leaveLobby(lobby.id, 'p2');

    expect(lobby.participants.size).toBe(1);
    expect(lobby.participants.has('p2')).toBe(false);
  });

  it('deletes lobby when last player leaves', () => {
    const lobby = createLobby('p1', 'Alice');
    const result = leaveLobby(lobby.id, 'p1');

    expect(result.deleted).toBe(true);
    expect(getLobby(lobby.id)).toBeUndefined();
    expect(getLobbyByCode(lobby.code)).toBeUndefined();
  });

  it('transfers host when host leaves', () => {
    const lobby = createLobby('p1', 'Alice');
    joinLobby(lobby.id, 'p2', 'Bob');
    joinLobby(lobby.id, 'p3', 'Charlie');

    const result = leaveLobby(lobby.id, 'p1');

    expect(result.deleted).toBe(false);
    expect(result.newHostId).toBeDefined();
    expect(lobby.hostId).not.toBe('p1');
    // New host has isHost flag
    const newHost = lobby.participants.get(lobby.hostId);
    expect(newHost!.isHost).toBe(true);
  });

  it('does not transfer host when non-host leaves', () => {
    const lobby = createLobby('p1', 'Alice');
    joinLobby(lobby.id, 'p2', 'Bob');

    const result = leaveLobby(lobby.id, 'p2');

    expect(result.deleted).toBe(false);
    expect(result.newHostId).toBeUndefined();
    expect(lobby.hostId).toBe('p1');
  });
});

describe('setReady', () => {
  it('sets player ready status', () => {
    const lobby = createLobby('p1', 'Alice');
    setReady(lobby.id, 'p1', true);

    expect(lobby.participants.get('p1')!.isReady).toBe(true);
  });

  it('can toggle ready off', () => {
    const lobby = createLobby('p1', 'Alice');
    setReady(lobby.id, 'p1', true);
    setReady(lobby.id, 'p1', false);

    expect(lobby.participants.get('p1')!.isReady).toBe(false);
  });

  it('returns false for unknown lobby or player', () => {
    expect(setReady('fake', 'p1', true)).toBe(false);
    const lobby = createLobby('p1', 'Alice');
    expect(setReady(lobby.id, 'unknown', true)).toBe(false);
  });
});

describe('canStartGame', () => {
  it('requires at least 2 participants', () => {
    const lobby = createLobby('p1', 'Alice');
    setReady(lobby.id, 'p1', true);

    expect(canStartGame(lobby)).toBe(false);
  });

  it('requires all participants to be ready', () => {
    const lobby = createLobby('p1', 'Alice');
    joinLobby(lobby.id, 'p2', 'Bob');
    setReady(lobby.id, 'p1', true);

    expect(canStartGame(lobby)).toBe(false);
  });

  it('returns true when all ready and enough players', () => {
    const lobby = createLobby('p1', 'Alice');
    joinLobby(lobby.id, 'p2', 'Bob');
    setReady(lobby.id, 'p1', true);
    setReady(lobby.id, 'p2', true);

    expect(canStartGame(lobby)).toBe(true);
  });
});

describe('listPublicLobbies', () => {
  it('only lists public non-full lobbies without games in progress', () => {
    const pub1 = createLobby('p1', 'Alice');
    const priv = createLobby('p2', 'Bob', { isPrivate: true });
    const full = createLobby('p3', 'Charlie', { maxPlayers: 2 });
    joinLobby(full.id, 'p4', 'Dana');
    const inProgress = createLobby('p5', 'Eve');
    inProgress.gameInProgress = true;

    const listed = listPublicLobbies();
    const ids = listed.map((l) => l.id);

    expect(ids).toContain(pub1.id);
    expect(ids).not.toContain(priv.id);
    expect(ids).not.toContain(full.id);
    expect(ids).not.toContain(inProgress.id);
  });

  it('sorts by fill percentage descending', () => {
    const lobby1 = createLobby('p1', 'Alice', { maxPlayers: 4 });
    const lobby2 = createLobby('p2', 'Bob', { maxPlayers: 4 });
    joinLobby(lobby2.id, 'p3', 'Charlie');
    joinLobby(lobby2.id, 'p4', 'Dana');

    const listed = listPublicLobbies();

    expect(listed[0]!.id).toBe(lobby2.id); // More full
    expect(listed[1]!.id).toBe(lobby1.id);
  });
});

describe('toLobbyInfo', () => {
  it('converts lobby to client-safe info', () => {
    const lobby = createLobby('p1', 'Alice', { isPrivate: true, password: 'secret' });
    joinLobby(lobby.id, 'p2', 'Bob', 'secret');

    const info = toLobbyInfo(lobby);

    expect(info.id).toBe(lobby.id);
    expect(info.code).toBe(lobby.code);
    expect(info.participants).toHaveLength(2);
    // Password stripped
    expect('password' in info.config).toBe(false);
    expect(info.config.isPrivate).toBe(true);
  });

  it('sorts participants by seat index', () => {
    const lobby = createLobby('p1', 'Alice');
    joinLobby(lobby.id, 'p2', 'Bob');
    joinLobby(lobby.id, 'p3', 'Charlie');

    const info = toLobbyInfo(lobby);

    expect(info.participants[0]!.seatIndex).toBe(0);
    expect(info.participants[1]!.seatIndex).toBe(1);
    expect(info.participants[2]!.seatIndex).toBe(2);
  });
});

describe('swapSeats', () => {
  it('swaps two participants\' seat indices', () => {
    const lobby = createLobby('p1', 'Alice');
    joinLobby(lobby.id, 'p2', 'Bob');
    joinLobby(lobby.id, 'p3', 'Charlie');

    const result = swapSeats(lobby.id, 0, 2);

    expect(result).toBe(true);
    expect(lobby.participants.get('p1')!.seatIndex).toBe(2);
    expect(lobby.participants.get('p3')!.seatIndex).toBe(0);
    expect(lobby.participants.get('p2')!.seatIndex).toBe(1); // unchanged
  });

  it('handles swapping same seat (no-op)', () => {
    const lobby = createLobby('p1', 'Alice');
    const result = swapSeats(lobby.id, 0, 0);
    expect(result).toBe(true);
    expect(lobby.participants.get('p1')!.seatIndex).toBe(0);
  });

  it('handles swapping participant with empty CPU seat', () => {
    const lobby = createLobby('p1', 'Alice', { maxPlayers: 4 });
    joinLobby(lobby.id, 'p2', 'Bob');
    // Seats: p1=0, p2=1, empty=2, empty=3

    const result = swapSeats(lobby.id, 0, 3);

    expect(result).toBe(true);
    expect(lobby.participants.get('p1')!.seatIndex).toBe(3);
    expect(lobby.participants.get('p2')!.seatIndex).toBe(1);
  });

  it('returns false for nonexistent lobby', () => {
    expect(swapSeats('fake', 0, 1)).toBe(false);
  });
});
