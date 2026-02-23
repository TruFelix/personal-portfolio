"use client"

import { HTMLProps, useState } from "react";
import CollectionDisplay from "./collectionDisplay/collectionDisplay";
import { Collection } from "./collectionDisplay/model";
import { ActivePlayerContext, Player } from "./contexts";

export default function Collections({ collections, className }: { collections: Collection[] } & HTMLProps<HTMLDivElement>) {
	const [activePlayer, setActivePlayer] = useState<Player | null | undefined>(undefined);

	return <div className={className}>
		<ActivePlayerContext value={{ activePlayer, setActivePlayer }}>
			{collections.map(collection => <CollectionDisplay key={collection.title} collection={collection} />)}
		</ActivePlayerContext>
	</div>
}