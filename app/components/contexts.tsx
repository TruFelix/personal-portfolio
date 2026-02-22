import { createContext, Dispatch, SetStateAction } from "react";

export interface Player {
	url: string;
	Pause: () => void;
}

export const ActivePlayerContext = createContext<{
	activePlayer: Player | null | undefined;
	setActivePlayer: Dispatch<SetStateAction<Player | null | undefined>>;
}>({activePlayer: undefined, setActivePlayer: undefined});