import { useState, useRef } from "react";

type GameSession = {
	id: string;
	// Add other properties if needed
};
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Trash2 } from "lucide-react"; // ✅ Import trash can icon
import {
	addPlayersToGameSession,
	createGameSession,
} from "../lib/supabaseFunctions"; // ✅ Supabase imports

function CreateGameSessionPage() {
	const today = new Date().toISOString().split("T")[0];
	const [date, setDate] = useState(today);
	const [name, setName] = useState("");
	const [players, setPlayers] = useState([""]);
	const playerInputRefs = useRef<HTMLInputElement[]>([]);
	const navigate = useNavigate();

	const handleAddPlayer = () => {
		setPlayers((prevPlayers) => [...prevPlayers, ""]);

		// Move focus to the last input field
		setTimeout(() => {
			const lastInput = playerInputRefs.current[players.length]; // Next input
			if (lastInput) lastInput.focus();
		}, 0);
	};

	const handleRemovePlayer = (index: number) => {
		setPlayers((prevPlayers) => prevPlayers.filter((_, i) => i !== index));
	};

	const handlePlayerChange = (index: number, value: string) => {
		const newPlayers = [...players];
		newPlayers[index] = value;
		setPlayers(newPlayers);
	};

	const handleKeyDown = (
		index: number,
		e: React.KeyboardEvent<HTMLInputElement>
	) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleAddPlayer();
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// 🛑 Check if name or date is empty
		if (!name.trim()) {
			console.error("Game name is required.");
			alert("Please enter a game name.");
			return;
		}

		if (!date) {
			console.error("Date is required.");
			alert("Please select a date.");
			return;
		}

		console.log("Creating game session with:", { name, date });

		try {
			// 🛠️ Create game session
			const gameSessionData = await createGameSession(name, new Date(date));

			if (!gameSessionData || gameSessionData.length === 0) {
				console.error("Failed to create game session: No data returned.");
				alert("Error creating game session. Please try again.");
				return;
			}

			const gameSessionId = (gameSessionData[0] as GameSession).id;
			console.log("Game session created with ID:", gameSessionId);

			// 🛠️ Add players
			const playerInsertResult = await addPlayersToGameSession(
				gameSessionId,
				players
			);

			if (!playerInsertResult) {
				console.error("Failed to add players. Error:", playerInsertResult);
				alert("Error adding players. Please try again.");
				return;
			}

			console.log("Players added successfully:", playerInsertResult);

			// ✅ Redirect to game overview
			navigate(`/game/${gameSessionId}`);
		} catch (error) {
			console.error("Unexpected error during game session creation:", error);
			alert("An unexpected error occurred. Please try again.");
		}
	};

	return (
		<div className="flex items-center justify-center h-screen">
			<Card className="w-[350px]">
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle className="text-lg">Create Game Session</CardTitle>
						<Button onClick={() => navigate(-1)}>Back</Button>
					</div>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<label htmlFor="name">Name of the game:</label>
							<Input
								type="text"
								id="name"
								value={name}
								onChange={(e) => setName(e.target.value)}
							/>
						</div>
						<div>
							<label htmlFor="date">Date:</label>
							<Input
								type="date"
								id="date"
								value={date}
								onChange={(e) => setDate(e.target.value)}
							/>
						</div>
						<div className="mb-12">
							<label>Players:</label>
							{players.map((player, index) => (
								<div key={index} className="flex items-center space-x-2">
									<Input
										type="text"
										value={player}
										onChange={(e) => handlePlayerChange(index, e.target.value)}
										onKeyDown={(e) => handleKeyDown(index, e)}
										ref={(el) => (playerInputRefs.current[index] = el!)}
									/>
									<Button
										type="button"
										onClick={() => handleRemovePlayer(index)}
										variant="ghost"
									>
										<Trash2 size={18} />
									</Button>
								</div>
							))}
							<Button type="button" onClick={handleAddPlayer} className="mt-2">
								Add Player
							</Button>
						</div>
						<Button type="submit" className="w-full">
							Create Game Session
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}

export default CreateGameSessionPage;
