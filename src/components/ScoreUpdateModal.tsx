import { useState } from "react";
import { updateScore } from "@/lib/supabaseFunctions";
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

	const handleScoreChange = (playerId: string, score: number) => {
		setScores({ ...scores, [playerId]: score });
	};

	const handleSubmit = async () => {
		for (const playerId in scores) {
			await updateScore(gameSessionId, playerId, round, scores[playerId]);
		}

		onScoresUpdated();
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

				<div className="space-y-2">
					{players.map((player) => (
						<div key={player.id}>
							<label htmlFor={`score-${player.id}`}>{player.name}:</label>
							<Input
								type="number"
								id={`score-${player.id}`}
								onChange={(e) =>
									handleScoreChange(player.id, parseInt(e.target.value))
								}
							/>
						</div>
					))}
				</div>

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
