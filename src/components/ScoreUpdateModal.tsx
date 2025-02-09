import { useState, useEffect } from "react";
import { updateScore, getScoresForRound } from "@/lib/supabaseFunctions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	AlertDialog,
	AlertDialogTrigger,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogCancel,
	AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface ScoreUpdateModalProps {
	gameSessionId: string;
	players: { id: string; name: string }[];
	onScoresUpdated: () => void;
}

function ScoreUpdateModal({
	gameSessionId,
	players,
	onScoresUpdated,
}: ScoreUpdateModalProps) {
	const [round, setRound] = useState(1);
	const [scores, setScores] = useState<{ [playerId: string]: number }>({});
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	// Fetch scores for the current round from the database when the round changes
	useEffect(() => {
		const fetchScores = async () => {
			const currentScores = await getScoresForRound(gameSessionId, round);
			const scoresObject: { [playerId: string]: number } = {};
			currentScores.forEach((score) => {
				scoresObject[score.player_id] = score.score;
			});
			setScores(scoresObject);
		};

		fetchScores();
	}, [round, gameSessionId]);

	const handleScoreChange = (playerId: string, score: number) => {
		setScores({ ...scores, [playerId]: score });
	};

	const handleSubmit = async () => {
		try {
			if (Object.keys(scores).length === 0) {
				setErrorMessage("Please enter scores for all players.");
				return;
			}

			// Submit the scores for each player
			for (const playerId in scores) {
				await updateScore(gameSessionId, playerId, round, scores[playerId]);
			}

			// Update the round number for the next submission
			setRound(round + 1);
			setErrorMessage(null);
			onScoresUpdated();
		} catch (error) {
			setErrorMessage(
				"There was an error saving the scores. Please try again."
			);
			console.error("Error during score submission:", error);
		}
	};

	const handleEnterKeyPress = (
		e: React.KeyboardEvent<HTMLInputElement>,
		index: number
	) => {
		if (e.key === "Enter") {
			const nextInput = document.querySelectorAll("input")[index + 1];
			if (nextInput) {
				(nextInput as HTMLElement).focus();
			}
		}
	};

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button>Update Scores</Button>
			</AlertDialogTrigger>
			<AlertDialogContent className="max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl w-full rounded-lg p-6">
				<AlertDialogHeader>
					<AlertDialogTitle>Update Scores for Round {round}</AlertDialogTitle>
					<AlertDialogDescription>
						Enter the scores for each player in this round.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
					{players.map((player, index) => (
						<div key={player.id} className="flex flex-col items-center">
							<label htmlFor={`score-${player.id}`} className="mb-2">
								{player.name}:
							</label>
							<Input
								type="number"
								id={`score-${player.id}`}
								className="w-14"
								value={scores[player.id] || ""}
								onChange={(e) =>
									handleScoreChange(player.id, parseInt(e.target.value))
								}
								onKeyDown={(e) => handleEnterKeyPress(e, index)}
								style={{
									appearance: "none", // Ensure no arrows appear
									WebkitAppearance: "none", // For webkit browsers
									MozAppearance: "textfield", // For Firefox
								}}
							/>
						</div>
					))}
				</div>

				{errorMessage && <p className="text-red-500">{errorMessage}</p>}

				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={handleSubmit}>
						Save Scores
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export default ScoreUpdateModal;
