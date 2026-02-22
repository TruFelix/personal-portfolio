"use client"

import { useState } from "react";
import CollectionDisplay from "./collectionDisplay/collectionDisplay";
import { ActivePlayerContext } from "./contexts";

export default function Collections({ collections }: { collections: Collection[] }) {
	const [activePlayer, setActivePlayer] = useState<Player | null | undefined>(undefined);

	return <ActivePlayerContext value={{ activePlayer, setActivePlayer }}>
		{collections.map(collection => <CollectionDisplay key={collection.title} collection={collection} />)}
	</ActivePlayerContext>
}