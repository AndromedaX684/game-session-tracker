import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import {
	getGameSessionData,
	getLeaderboardData,
} from "../lib/supabaseFunctions";
import ScoreUpdateModal from "../components/ScoreUpdateModal";
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { Button } from "../components/ui/button";

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend
);

interface GameSession {
	id: string;
	name: string;
	date: string;
}

interface Player {
	id: string;
	name: string;
}

interface Score {
	player_id: string;
	round: number;
	score: number;
}

interface LeaderboardItem {
	player_id: string;
	total_score: number;
	players: {
		name: string;
	};
}

function GameOverviewPage() {
	const { gameId } = useParams<{ gameId: string }>();
	const [gameSession, setGameSession] = useState<GameSession | null>(null);
	const [players, setPlayers] = useState<Player[]>([]);
	const [scores, setScores] = useState<Score[]>([]);
	const [leaderboardData, setLeaderboardData] = useState<LeaderboardItem[]>([]);
	const [isScoresUpdated, setIsScoresUpdated] = useState(false);
	const navigate = useNavigate();

	useEffect(() => {
		async function fetchData() {
			if (!gameId) return;

			const gameSessionData = await getGameSessionData(gameId);
			if (gameSessionData) {
				setGameSession(gameSessionData);
				setPlayers(gameSessionData.players);
				setScores(gameSessionData.scores);
			}

			const leaderboardData = await getLeaderboardData(gameId);
			if (leaderboardData) {
				setLeaderboardData(leaderboardData as LeaderboardItem[]);
			}
		}

		fetchData();
		setIsScoresUpdated(false);
	}, [gameId, isScoresUpdated]);

	if (!gameSession) {
		return <div>Loading...</div>;
	}

	const handleScoresUpdated = () => {
		setIsScoresUpdated(true);
	};

	// Prepare chart data
	const rounds = [...new Set(scores.map((score) => score.round))].sort(
		(a, b) => a - b
	);
	const chartData = {
		labels: rounds.map((round) => `Round ${round}`),
		datasets: players.map((player) => {
			const playerData = rounds.map((round) => {
				const score = scores.find(
					(score) => score.player_id === player.id && score.round === round
				);
				return score ? score.score : 0;
			});

			const colors = [
				"#FF6384",
				"#36A2EB",
				"#FFCE56",
				"#4BC0C0",
				"#9966FF",
				"#FF9F40",
			];
			const colorIndex =
				players.findIndex((p) => p.id === player.id) % colors.length;
			const color = colors[colorIndex];
			return {
				label: player.name,
				data: playerData,
				borderColor: color,
				backgroundColor: color,
			};
		}),
	};

	return (
		<div>
			<h1>{gameSession.name}</h1>
			<p>Date: {gameSession.date}</p>

			<h2>Leaderboard</h2>
			<ul>
				{leaderboardData.map((item) => (
					<li key={item.player_id}>
						{item.players?.name}: {item.total_score}
					</li>
				))}
			</ul>

			{gameId && (
				<ScoreUpdateModal
					gameSessionId={gameId}
					players={players}
					onScoresUpdated={handleScoresUpdated}
				/>
			)}

			<h2>Score Progression</h2>
			<Line data={chartData} />
		</div>
	);
}

export default GameOverviewPage;
