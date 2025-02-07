import { supabase } from "./supabaseClient";

interface GameSession {
	id: string;
	name: string;
	date: string;
}

export async function createGameSession(
	name: string,
	date: Date
): Promise<GameSession[] | null> {
	const { data, error } = await supabase
		.from("Game Sessions")
		.insert([{ name, date }])
		.select("*");

	if (error) {
		console.error("Error creating game session:", error);
		return null;
	}

	return data as GameSession[];
}

export async function getGameSessionData(gameSessionId: string) {
	const { data: gameSession, error: gameSessionError } = await supabase
		.from("Game Sessions")
		.select("*")
		.eq("id", gameSessionId)
		.single();

	if (gameSessionError) {
		console.error("Error fetching game session:", gameSessionError);
		return null;
	}

	const { data: players, error: playersError } = await supabase
		.from("Players")
		.select("*")
		.eq("game_session_id", gameSessionId);

	if (playersError) {
		console.error("Error fetching players:", playersError);
		return null;
	}

	const { data: scores, error: scoresError } = await supabase
		.from("Scores")
		.select("*")
		.eq("game_session_id", gameSessionId);

	if (scoresError) {
		console.error("Error fetching scores:", scoresError);
		return null;
	}

	return {
		...gameSession,
		players,
		scores,
	};
}

export async function getLeaderboardData(gameSessionId: string) {
	const { data, error } = await supabase.rpc("get_leaderboard", {
		game_session_id: gameSessionId,
	});

	if (error) {
		console.error("Error fetching leaderboard data:", error);
		return null;
	}

	return data;
}

export async function updateScore(
	gameSessionId: string,
	playerId: string,
	round: number,
	score: number
) {
	const { data, error } = await supabase
		.from("Scores")
		.upsert(
			[{ game_session_id: gameSessionId, player_id: playerId, round, score }],
			{ onConflict: "game_session_id, player_id, round" }
		);

	if (error) {
		console.error("Error updating score:", error);
		return null;
	}

	return data;
}

export async function addPlayersToGameSession(
	gameSessionId: string,
	playerNames: string[]
) {
	const players = playerNames.map((name) => ({
		game_session_id: gameSessionId,
		name,
	}));

	const { data, error } = await supabase.from("Players").insert(players);

	if (error) {
		console.error("Error adding players to game session:", error);
		return null;
	}

	return data;
}
