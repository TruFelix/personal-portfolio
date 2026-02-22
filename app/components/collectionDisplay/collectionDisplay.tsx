/* eslint-disable @next/next/no-img-element */
import React from "react";
import { AudioPlayer } from "../audioPlayer/audioPlayer";
import { Collection } from "./model";

export interface CollectionDisplayProps extends React.PropsWithChildren {
	collection: Collection;
}

const Card = ({ children, className }: React.PropsWithChildren & React.HTMLProps<HTMLElement>) =>
	<div className={`rounded-xl overflow-hidden p-6 shadow-lg grid ${className}`}>{children}</div>;

export default function CollectionDisplay({ collection }: CollectionDisplayProps) {
	return <>
		<Card className="w-full m-3 bg-zinc-200/20 gap-3">
			<span className="max-w-[410px] gap-3">
				<div className="float-left pr-3 transition-w duration-300">
					<img
						className="w-30 rounded"
						src={collection.coverImgUrl}
						alt="Cover image of 23 : 25"
					/>
				</div>
				<h2 className="text-xl/3.5 mb-2 align-text-top font-semibold w-fit text-nowrap">{collection.title}</h2>
				<span className="text-base/4 align-text-bottom">{collection.description}</span>
			</span>
			<div className="grid gap-1.5">
				{collection.songs.map(song => <AudioPlayer key={song.url} audioUrl={song.url} />)}
			</div>
		</Card>
	</>;
}