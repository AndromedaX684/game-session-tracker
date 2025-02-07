import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	addPlayersToGameSession,
	createGameSession,
} from "../lib/supabaseFunctions";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GameSession {
	id: string;
	name: string;
	date: string;
}

function CreateGameSessionPage() {
	const [name, setName] = useState("");
	const [date, setDate] = useState("");
	const [players, setPlayers] = useState([""]);
	const navigate = useNavigate();

	const handleAddPlayer = () => {
		setPlayers([...players, ""]);
	};

	const handlePlayerChange = (index: number, value: string) => {
		const newPlayers = [...players];
		newPlayers[index] = value;
		setPlayers(newPlayers);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Create game session
		const gameSessionData = await createGameSession(name, new Date(date));

		if (gameSessionData) {
			const gameSessionId = (gameSessionData[0] as GameSession).id;

			// Add players to game session
			await addPlayersToGameSession(gameSessionId, players);

			// Redirect to game overview page
			navigate(`/game/${gameSessionId}`);
		}
	};

	return (
		<div className="flex items-center justify-center h-screen">
			<Button onClick={() => navigate("/")}>Back</Button>
			<Card className="w-[350px]">
				<CardHeader>
					<CardTitle>Create Game Session</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit}>
						<div>
							<label htmlFor="name">Name:</label>
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
						<div>
							<label>Players:</label>
							{players.map((player, index) => (
								<div key={index}>
									<Input
										type="text"
										value={player}
										onChange={(e) => handlePlayerChange(index, e.target.value)}
									/>
								</div>
							))}
							<Button type="button" onClick={handleAddPlayer}>
								Add Player
							</Button>
						</div>
						<Button type="submit">Create Game Session</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}

export default CreateGameSessionPage;
