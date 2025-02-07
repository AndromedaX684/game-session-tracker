import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
	BarElement,
	Title,
	Tooltip,
	Legend,
} from "chart.js";
import { LineChart } from "../features/charts/LineChart";
import { BarChart } from "../features/charts/BarChart";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";

// Register required Chart.js components.
ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	BarElement,
	Title,
	Tooltip,
	Legend
);

// Define your types (if not imported from a central types file)
interface GameSession {
	id: string;
	name: string;
	date: string;
	players: Player[];
	scores: Score[];
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
	// The function returns a JSON object for the player,
	// so we access the player's name via item.players.name.
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

			try {
				// Get the game session details.
				const gameSessionData = await getGameSessionData(gameId);
				if (gameSessionData) {
					setGameSession(gameSessionData);
					setPlayers(gameSessionData.players);
					setScores(gameSessionData.scores);
				}

				// Get the leaderboard data via the Supabase RPC.
				const leaderboard = await getLeaderboardData(gameId);
				console.log("Raw leaderboard data:", leaderboard);
				if (leaderboard) {
					setLeaderboardData(leaderboard as LeaderboardItem[]);
				}
			} catch (error) {
				console.error("Error fetching game session data:", error);
			}
		}
		fetchData();
		setIsScoresUpdated(false);
	}, [gameId, isScoresUpdated]);

	// Calculate rounds from scores.
	const rounds = useMemo(() => {
		return [...new Set(scores.map((score) => score.round))].sort(
			(a, b) => a - b
		);
	}, [scores]);

	// Prepare data for the LineChart (score progression).
	const chartData = useMemo(() => {
		return {
			labels: rounds.map((round) => `Round ${round}`),
			datasets: players.map((player) => {
				const playerData = rounds.map((round) => {
					const scoreEntry = scores.find(
						(score) => score.player_id === player.id && score.round === round
					);
					return scoreEntry ? scoreEntry.score : 0;
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
	}, [rounds, players, scores]);

	// Prepare data for the BarChart (total points per player).
	const barChartData = useMemo(() => {
		const data = {
			labels: leaderboardData.map((item) => item.players?.name || ""),
			datasets: [
				{
					label: "Total Points",
					data: leaderboardData.map((item) => item.total_score),
					backgroundColor: "rgba(53, 162, 235, 0.8)",
				},
			],
		};
		console.log("Bar chart data:", data);
		return data;
	}, [leaderboardData]);

	if (!gameSession) {
		return <div>Loading...</div>;
	}

	const handleScoresUpdated = () => {
		setIsScoresUpdated(true);
	};

	return (
		<div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
			{/* Left Column: Game Info and Leaderboard */}
			<div>
				<Card>
					<CardHeader>
						<CardTitle className="text-2xl font-bold">
							{gameSession.name}
						</CardTitle>
						<CardDescription>Date: {gameSession.date}</CardDescription>
					</CardHeader>
					<CardContent>
						<h2 className="mt-4 text-xl font-semibold">Leaderboard</h2>
						<ul className="mt-2 space-y-1">
							{leaderboardData.map((item) => (
								<li
									key={item.player_id}
									className="flex justify-between border-b pb-1 last:border-b-0"
								>
									<span>{item.players?.name}</span>
									<span>{item.total_score}</span>
								</li>
							))}
						</ul>
						{gameId && (
							<div className="mt-4">
								<ScoreUpdateModal
									gameSessionId={gameId}
									players={players}
									onScoresUpdated={handleScoresUpdated}
								/>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Right Column: Charts */}
			<div className="space-y-6">
				{/* Score Progression (Line Chart) */}
				<Card>
					<CardHeader>
						<CardTitle className="text-2xl font-bold">
							Score Progression
						</CardTitle>
					</CardHeader>
					<CardContent className="h-80">
						<LineChart
							data={chartData}
							options={{ maintainAspectRatio: false }}
							redraw
						/>
					</CardContent>
				</Card>

				{/* Total Points (Bar Chart) */}
				<Card>
					<CardContent className="h-80">
						<BarChart
							data={barChartData}
							options={{ maintainAspectRatio: false }}
							redraw
						/>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

export default GameOverviewPage;
