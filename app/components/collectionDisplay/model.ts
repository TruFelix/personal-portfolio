export interface Collection {
	coverImgUrl: string;
	title: string;
	years?: string | undefined | null;
	characteristics?: string[] | string[] | undefined | null;
	description?: string | undefined | null;
	songs: Song[];
}

export interface Song {
	title: string;
	url: string;
}