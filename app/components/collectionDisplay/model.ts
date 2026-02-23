export interface Collection {
	coverImgUrl: string;
	title: string;
	description?: string | undefined | null;
	songs: Song[];
}

export interface Song {
	title: string;
	url: string;
}