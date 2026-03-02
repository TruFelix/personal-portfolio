/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import React from "react";
import { AudioPlayer } from "../audioPlayer/audioPlayer";
import DolbyAtmos from "./DolbyAtmos";
import { Collection } from "./model";

export type CollectionDisplayProps = React.PropsWithChildren & {
	collection: Collection;
} & CollectionTranslations;

export type CollectionTranslations = {
	mixedIn: string,
	mixedInAtmosAltText: string
}

const Card = ({ children, className }: React.PropsWithChildren & React.HTMLProps<HTMLElement>) =>
	<div className={`rounded-xl overflow-hidden p-3 md:p-6 shadow-lg grid ${className}`}>{children}</div>;

export default function CollectionDisplay({ collection, mixedIn, mixedInAtmosAltText }: CollectionDisplayProps) {
	return <>
		<Card className="w-full bg-zinc-200/20">
			<span className="gap-3 mb-6 px-2">
				<div className="float-left pr-3 transition-w duration-300" style={{ marginLeft: "calc(-2 * var(--spacing))" }}>
					<Image
						width="128"
						height="128"
						className="w-30 rounded"
						src={collection.coverImgUrl}
						alt="Cover image of 23 : 25"
					/>
				</div>
				<h2 className="font-title text-[30px] leading-[35px] font-[600] mb-2 align-text-top text-nowrap">
					{collection.title}
				</h2>
				<span className="font-emphasis text-[20px] md:leading-[1.5rem] leading-[1.35rem] mb-2 font-[600] align-text-bottom md:inline-block">
					{collection.years} {collection.characteristics?.length && "–"} {collection.characteristics?.map((c, i) => `${i ? '•' : ''} ${c} `)}
				</span>
				<div className="h-3 md:h-0" />
				<span className="font-emphasis text-[22px] leading-[1.35rem] mt-2 font-[450] align-text-bottom inline-block">
					{collection.description?.split("\n").map((c, i, a) => <p key={i} className={i != a.length - 1 ? "mb-1" : ""}>{c}</p>)}
				</span>
			</span>
			<div className="grid gap-1.5">
				{collection.songs.map(song => <div key={song.url}>
					<span>
						{song.title}&nbsp;&nbsp;
						{/* {mixedIn} */}
						<DolbyAtmos
							height={30}
							width={100}
							className={`inline h-[30px] ${song.isAtmosAvailable ? "fill-black dark:fill-stone-200" : "fill-stone-300 dark:fill-zinc-600"}`}
							alt={mixedInAtmosAltText}
						/>
					</span>
					<AudioPlayer audioUrl={song.url}/>
				</div>
				)}
			</div>
		</Card>
	</>;
}