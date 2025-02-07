import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { updateScore } from "../lib/supabaseFunctions";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";

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
		<Sheet>
			<SheetTrigger asChild>
				<Button>Update Scores</Button>
			</SheetTrigger>
			<SheetContent className="sm:max-w-md">
				<SheetHeader>
					<SheetTitle>Update Scores for Round {round}</SheetTitle>
					<SheetDescription>
						Enter the scores for each player in this round.
					</SheetDescription>
				</SheetHeader>
				<div>
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
				<Button onClick={handleSubmit}>Save Scores</Button>
			</SheetContent>
		</Sheet>
	);
}

export default ScoreUpdateModal;
