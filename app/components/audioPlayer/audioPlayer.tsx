"use client"

import { MouseEvent, useContext, useEffect, useRef, useState } from "react";
import { ActivePlayerContext } from "../contexts";
import Knob from "../knob/knob";
import { useWindowSize } from "../utils";

// SVG Paths from Figma
const PLAY_ICON_PATH = "M9.09327 0L18.1865 15.75H0L9.09327 0Z";
const PAUSE_ICON_PATH = "M18 0H7.86805e-08L0 4.48571L18 4.48571V0ZM18 13.4714L1.18021e-07 13.4714L7.86805e-08 18H18L18 13.4714Z";

type WaveformDataType = {
	audioUrl: string,
	[barCount: number]: number[]
}

export type AudioPlayerProps = {
	audioUrl: string,
	barPlayedColor?: string,
	barNotPlayedColor?: string,
	barPlayedNotPlayingColor?: string,
	barsMaxHeight?: number,
	barsCount?: number,
};

/**
 * Plays a given [audioUrl], shows its waveform and a volume knob.
 * Can be play/paused and shows progress via the [barPlayedColor] and [barNotPlayedColor].
 * Between play/pause visuals are animated.
 * According to the volume the waveform is taller more squashed.
 */
export function AudioPlayer({
	audioUrl,
	barPlayedNotPlayingColor = "hsl(from var(--primary) h 0 calc(l + 20))",
	barPlayedColor = "var(--primary)",
	barNotPlayedColor = "#d9d9d9",
	barsMaxHeight = 30 / 0.8,
}: AudioPlayerProps) {
	const minVolume = 0;
	const maxVolume = 10;

	const { activePlayer, setActivePlayer } = useContext(ActivePlayerContext);

	const size = useWindowSize(null);
	const isMobile = (size?.width ?? 0) < 600;
	const barsCount = isMobile ? 48 : 80;
	// console.log("barsCount: ", barsCount);

	/** should play loading animation */
	const [isAudioLoading, setIsAudioLoading] = useState<boolean>(false);
	const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
	const [shouldBePlaying, setShouldBePlaying] = useState(false);
	const [loadedWaveformData, setLoadedWaveformData] = useState<WaveformDataType | null | undefined>();
	const [waveformData, setWaveformData] = useState<number[]>(new Array(barsCount).fill(0));
	const [volume, setVolume] = useState<number>(8);
	const [errorLoading, setErrorLoading] = useState<boolean>(false);

	/** Point in globalTime where playback was stopped by the user */
	const globalPausedAtRef = useRef<number>(0);
	const globalStartedTimeRef = useRef<number>(0);
	const barsContainerRef = useRef<HTMLDivElement | null>(null);
	const audioContextRef = useRef<AudioContext | null>(null);
	const loadingAnimationRef = useRef<NodeJS.Timeout | undefined>(undefined);

	// null indicates that it is currently loading
	// undefined would mean not loading
	// a value means loaded
	const isWaveformDataLoading = loadedWaveformData === null;
	const isLoading = isWaveformDataLoading || isAudioLoading;

	const audioNodeRef = useRef<HTMLAudioElement | null>(null);

	// required to stop the indication of progress by animating the color of the bars
	const currentAnimQueue = useRef<number | undefined>(undefined);

	const volumePercent = (volume - minVolume) / maxVolume;

	// select the right waveformdata
	const selectedWaveformData = loadedWaveformData ? loadedWaveformData[barsCount] : waveformData;
	// useEffect(() => {
	// 	// console.log("barsCount: ", barsCount);
	// 	setWaveformData(selectedWaveformData);
	// }, [shouldBePlaying, selectedWaveformData]);

	// handle loading indication
	useEffect(() => {
		if (!shouldBePlaying) {
			ensureLoadingAnimationStopped();
			ensureUpdateBarIndicationStopped();
			updateBarIndication(globalPausedAtRef.current);
			return;
		}

		if (isLoading) {
			ensureLoadingAnimation();
		} else {
			ensureLoadingAnimationStopped();
			setWaveformData(selectedWaveformData);
			updateBarIndication(globalPausedAtRef.current);
		}

		if (isAudioPlaying) {
			ensureUpdateBarIndicationRunning();
		} else {
			ensureUpdateBarIndicationStopped()

		}
	}, [isLoading, isAudioPlaying, shouldBePlaying]);

	// attach evHandlers to audioNode
	// these evHandlers update isAudioPlaying for syncing playing and ui
	useEffect(() => {
		const cur = audioNodeRef.current;
		if (!cur) return;

		const _handlePlay = (reason: string) => () => {
			console.log("playing: ", reason);
			setIsAudioPlaying(true);
			setIsAudioLoading(false);
		}

		const _handlePause = () => {
			console.log("paused by something");
			setIsAudioPlaying(false)
		};
		const _handleLoad = (reason: string) => () => {
			console.log("loading audio: ", reason);
			setIsAudioLoading(true);
			setIsAudioPlaying(false);
		}

		const cleanup = () => {
			cur.removeEventListener("play", _handlePlay("for some reason"));
			cur.removeEventListener("playing", _handlePlay("'playing'"));
			cur.removeEventListener("pause", _handlePause);
			cur.removeEventListener("loadstart", _handleLoad("loadStart"));
			cur.removeEventListener("load", _handleLoad("load"));
			cur.removeEventListener("waiting", _handleLoad("waiting"));
			// cur.removeEventListener("loadeddata", _handleLoaded);
		}

		cur.addEventListener("play", _handlePlay("for some reason"));
		cur.addEventListener("playing", _handlePlay("'playing'"));
		cur.addEventListener("pause", _handlePause);
		cur.addEventListener("loadstart", _handleLoad("loadStart"));
		cur.addEventListener("load", _handleLoad("load"));
		cur.addEventListener("waiting", _handleLoad("waiting"));
		// cur.addEventListener("loadeddata", _handleLoaded);

		return cleanup;
	}, [audioNodeRef, audioNodeRef.current])

	useEffect(() => {
		// gainNodeRef.current?.gain.setValueAtTime(volumePercent, 0);
		if (audioNodeRef.current) audioNodeRef.current.volume = volumePercent;

		barsContainerRef.current?.childNodes.forEach(b => updateBarHeight(b as HTMLElement));
	}, [volume]);

	const togglePlay = async (e: MouseEvent) => {
		if (isAudioPlaying || shouldBePlaying) {
			Pause();
		} else {
			await Play();
		}
	};

	async function PlayFrom(start: number) {
		globalPausedAtRef.current = start;
		// console.log("Starting from ", start);
		Play();
	}

	async function Play() {
		const audioNode = audioNodeRef.current!;

		if (!audioNode.paused) {
			// don't allow to just set time, use audioNodeRef.current.currentTime = ...;
			return;
		}

		audioNode.src = audioUrl;
		setShouldBePlaying(true);

		if (!loadedWaveformData) {
			ensureLoadingAnimation();
			await loadAudio();
		}

		audioNode.currentTime = audioContextRef.current!.currentTime;

		if (activePlayer?.url !== audioUrl) {
			activePlayer?.Pause();
		}

		if (!audioContextRef.current) {
			console.error("audiocontext uninitialized");
			return;
		}

		if (audioContextRef.current.state === 'suspended') {
			await audioContextRef.current.resume();
		}

		audioNode.play();
		audioNode.currentTime = globalPausedAtRef.current;
		globalStartedTimeRef.current = globalPausedAtRef.current;
		setActivePlayer?.({
			url: audioUrl,
			Pause,
		});
	}

	function Pause() {
		globalPausedAtRef.current = audioNodeRef.current?.currentTime ?? 0;

		if (!audioNodeRef.current?.paused) {
			audioNodeRef.current!.pause();
		}

		setShouldBePlaying(false);
	}

	return (
		<div className="grid grid-flow-col grid-cols-[1fr_auto] gap-1.5">
			<button
				className={cn(
					"grid grid-flow-col grid-cols-[auto_1fr] items-center block cursor-pointer rounded-[6px] w-full h-[48px] transition-colors duration-300 ease-in-out",
					shouldBePlaying ? "bg-neutral-100 dark:bg-neutral-700" : "bg-neutral-100 dark:bg-[rgba(138,138,138,0.65)]"
				)}
				data-name="AudioPlayer"
			>
				<audio ref={audioNodeRef} playsInline onLoadedData={ev => {
					audioNodeRef.current?.setAttribute("loaded", "true");
				}} />
				{/* Play/Pause Icon Container */}
				<div
					className="size-[22px] mx-2 ml-3 flex justify-items-center items-center"
					role="button"
					tabIndex={0}
					onClick={togglePlay}
				>
					<div className={cn(
						"flex-none transition-all duration-300",
						shouldBePlaying ? "size-[18px]" : "size-[21px]"
					)}>
						{shouldBePlaying ? (
							// Pause Icon
							<svg className="rotate-90" fill="none" preserveAspectRatio="1" viewBox="0 0 18 18">
								<path
									fillRule="evenodd"
									clipRule="evenodd"
									d={PAUSE_ICON_PATH}
									className="fill-neutral-400 dark:fill-neutral-300"
								/>
							</svg>
						) : (
							// Play Icon
							<svg className="rotate-90 mt-[1px]" fill="none" preserveAspectRatio="1" viewBox="0 0 18.1865 15.75">
								<path d={PLAY_ICON_PATH}
									className="fill-neutral-400 dark:fill-neutral-300"
								/>
							</svg>
						)}
					</div>
				</div>
				<div
					className="flex mr-3 h-[19px] items-center transition-all duration-300"
					ref={barsContainerRef}
				>
					{waveformData.map((value, index) => {
						// Calculate height between 3px and 19px based on value (0..1)
						// If value is very small, min height 3px.
						// Max height 19px.
						const height = Math.max(3, value * barsMaxHeight * volumePercent);

						let timestampInSeconds: number | null = null;
						if (audioNodeRef.current && audioContextRef.current) {
							const audioLengthInSeconds = audioNodeRef.current.duration ?? 0
							const timeAdvancePerBarInSeconds = audioLengthInSeconds / barsCount;
							timestampInSeconds = timeAdvancePerBarInSeconds * (index + 1);
						}
						const currentT = currentTime();
						const bgC = barBackgroundColorFromTimestamp(timestampInSeconds ?? 0, currentT);
						console.log("currentT: ", currentT, " bgC: ", bgC);

						return (
							<div
								key={index}
								className={cn(
									errorLoading && "bg-orange-600",
									"bg-zinc-300 grow min-w-[1px] rounded-[1px] transition-all duration-300 mx-[1px]",
									shouldBePlaying && "dark:shadow-[0px_0px_10px_0px_var(--primary)]",
									// isPlaying && (timestampInSeconds < currentT
									// 	? "shadow-[0px_0px_10px_0px_var(--color-primary-transparent-500)]"
									// 	: `shadow-[0px_0px_5px_0px_gray] shadow-color-[gray]`)
								)}
								data-maxheight={height}
								style={{
									height: `${height}px`,
									backgroundColor: bgC,
									// boxShadow: barShadowFromTimestamp(timestampInSeconds, currentT)
								}}
								onMouseUp={e => {
									console.log("log")
									if (timestampInSeconds != null) {
										e.bubbles = false;
										e.preventDefault();

										if (!audioNodeRef.current?.paused) {
											Pause();
										}

										PlayFrom(timestampInSeconds);
									} else {
										if (!audioNodeRef.current?.paused) {
											Pause();
										}

										Play();
										console.log("shouldPlay by press on empty waveform")
									}
								}}
								onMouseDown={Pause}
							/>
						);
					})}
				</div>
			</button>
			<div className="flex items-center ml-2">
				<Knob
					min={minVolume} max={maxVolume}
					step={0.1}
					value={volume}
					onChange={setVolume}
					label="vol"
					width="38px"
				/>
			</div>
		</div>
	);

	function updateBarHeight(bar: HTMLElement): void {
		const maxHeight = Number.parseFloat(bar.getAttribute("data-maxheight")!);
		bar.style.height = maxHeight * volumePercent + "px";
	}

	function ensureUpdateBarIndicationRunning(): void {
		console.log("ensureUpdateBarIndicationRunning");
		if (currentAnimQueue.current) return;
		__queueUpdateBarIndication();
	}

	function __queueUpdateBarIndication() {
		currentAnimQueue.current = requestAnimationFrame(__queueUpdateBarIndication);
		updateBarIndication(currentTime());
	}

	function ensureUpdateBarIndicationStopped(): void {
		console.log("ensureUpdateBarIndicationStopped");
		if (!currentAnimQueue.current) return;

		cancelAnimationFrame(currentAnimQueue.current)
		currentAnimQueue.current = undefined;

		updateBarIndication(currentTime());
	}

	function ensureLoadingAnimation() {
		if (!loadingAnimationRef.current) {
			loadingAnimationRef.current = setInterval(() => animateBarsLoading(0.75, 3), 100);
		}
	}
	function ensureLoadingAnimationStopped() {
		if (!loadingAnimationRef.current) return;

		clearInterval(loadingAnimationRef.current);
		loadingAnimationRef.current = undefined;
	}

	function updateBarIndication(currentPlaytime: number): void {
		// console.log("updateBarIndication: ", currentPlaytime);
		if (!barsContainerRef.current) return;
		if (errorLoading) return;

		const audioLengthInSeconds = audioNodeRef.current?.duration ?? 0;
		const timeAdvancePerBarInSeconds = audioLengthInSeconds / barsCount;
		let timestampInSeconds = 0.000001;

		for (let barIndex = 0; barIndex < barsContainerRef.current.childNodes.length; barIndex++) {
			timestampInSeconds += timeAdvancePerBarInSeconds;
			const bar = barsContainerRef.current.childNodes.item(barIndex) as HTMLDivElement;
			bar.style.backgroundColor = barBackgroundColorFromTimestamp(timestampInSeconds, currentPlaytime) ?? "";
			bar.style.boxShadow = barShadowFromTimestamp(timestampInSeconds, currentPlaytime) ?? "";
			// console.log(bar.style.boxShadow);
		}
	}

	function barBackgroundColorFromTimestamp(timestampInSeconds: number, currentPlaytime: number): string {
		if (timestampInSeconds <= currentPlaytime) {
			if (shouldBePlaying) {
				return barPlayedColor;
			} else {
				return barPlayedNotPlayingColor;
			}
		} else {
			return barNotPlayedColor;
		}
	}
	function barShadowFromTimestamp(timestampInSeconds: number, currentPlaytime: number): string | null {
		const isDarkTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)')?.matches;
		if (isDarkTheme) return null;

		if (!shouldBePlaying) return null;

		if (timestampInSeconds < currentPlaytime) {
			return "0px 0px 10px 0px var(--color-primary-transparent-500)";
		} else {
			return "0px 0px 2.5px 0px rgb(from gray r g b / 0.2)";
		}
	}

	function currentTime(): number {
		const t = audioNodeRef.current?.currentTime || globalPausedAtRef.current || 0;
		// console.log("currentTime: ", t)
		return t;
	}

	/** Animates the wavebarData to create a loading animation */
	function animateBarsLoading(freq: number = 1, travelspeed: number = 1) {
		const millis = new Date().valueOf();
		const tmp = new Array(barsCount).fill(0).map((_, i) => (Math.sin(i / 3 * freq - millis / 500 * travelspeed) + 1) / 2);
		setWaveformData(tmp);
	}

	//#region audio loading and computation
	async function loadAudio() {
		setLoadedWaveformData(null);
		try {
			const AudioContext = window.AudioContext;
			const ctx = new AudioContext();
			audioContextRef.current = ctx;

			const response = await fetch(`/api/waveform?audioUrl=${encodeURIComponent(audioUrl)}`);

			if (!response.ok) {
				setErrorLoading(true);
				return;
			}

			setLoadedWaveformData(await response.json());
			updateBarIndication(globalPausedAtRef.current);
		} catch (error) {
			console.error("Failed to load audio:", error);
			setErrorLoading(true);
		}
	}
	//#endregion
}

function cn(...inputs: unknown[]) {
	return inputs.join(" ")
}