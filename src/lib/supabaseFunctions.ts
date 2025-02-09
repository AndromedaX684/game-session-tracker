import { supabase } from "./supabaseClient";

export async function createGameSession(name: string, date: Date) {
	console.log("🔍 Sending data to Supabase:", { name, date });

	const { data, error } = await supabase
		.from("Game Sessions")
		.insert([{ name, date }])
		.select("*");

	if (error) {
		console.error("❌ Error creating game session:", error);
		alert("Failed to create game session. Check the console for details.");
		return null;
	}

	console.log("✅ Game session created:", data);
	return data;
}

export async function getGameSessionData(gameSessionId: string) {
	const { data: gameSession, error: gameSessionError } = await supabase
		.from("Game Sessions")
		.select("*")
		.order("created_at", { ascending: true })
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

export async function getLeaderboardData(gameId: string) {
	// Note: The key is _game_session_id because your SQL function parameter is named that.
	const { data, error } = await supabase.rpc("get_leaderboard", {
		_game_session_id: gameId,
	});
	if (error) {
		console.error("Error fetching leaderboard:", error);
		return null;
	}
	return data;
}

/**
 * Fetch the latest round number for a given game session.
 *
 * @param gameSessionId - The ID of the game session.
 * @returns The latest round number or null if no rounds are found.
 */

export const getLatestRound = async (
	gameSessionId: string
): Promise<number | null> => {
	try {
		console.log(`Fetching latest round for game session ${gameSessionId}`);

		// Query the database for the latest round for the provided game session ID
		const { data, error } = await supabase
			.from("Scores")
			.select("round")
			.eq("game_session_id", gameSessionId) // Filter by the game session ID
			.order("round", { ascending: false }) // Order by round number descending (latest first)
			.limit(1); // Only get the latest round

		if (error) {
			console.error("Error fetching latest round:", error);
			return null; // Return null in case of an error
		}

		// If no rounds are found, return null
		if (data?.length === 0) {
			console.log("No rounds found for this session.");
			return null;
		}

		// Return the latest round number
		console.log("Latest round data:", data);
		return data[0].round;
	} catch (error) {
		console.error("Error fetching latest round:", error);
		return null; // Return null in case of an error
	}
};

export async function getScoresForRound(gameSessionId: string, round: number) {
	const { data, error } = await supabase
		.from("Scores")
		.select("*")
		.eq("game_session_id", gameSessionId)
		.eq("round", round);

	if (error) {
		console.error("Error fetching scores:", error);
		return [];
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
			{ onConflict: "game_session_id,player_id,round" }
		);

	if (error) {
		console.error("Error updating score:", error);
		return null;
	}

	return data;
}

export async function addPlayersToGameSession(
	gameSessionId: string,
	players: string[] // an array of player names
) {
	try {
		if (!players || players.length === 0) {
			console.error("No players provided to add.");
			return null;
		}

		console.log("Adding players:", players, "to game session:", gameSessionId);

		// Insert players into the "Players" table
		const { data, error } = await supabase
			.from("Players") // Assuming your table name is "Players"
			.upsert(
				players.map((player) => ({
					game_session_id: gameSessionId,
					name: player,
				}))
			)
			.select("*");

		if (error) {
			console.error("Error inserting players:", error);
			return null;
		}

		console.log("Players inserted:", data);
		return data;
	} catch (error) {
		console.error("Unexpected error in addPlayersToGameSession:", error);
		return null;
	}
}
