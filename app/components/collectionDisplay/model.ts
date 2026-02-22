export interface Collection {
	coverImgUrl: string;
	title: string;
	description?: React.ReactNode;
	songs: Song[];
}

export interface Song {
	title: string;
	url: string;
}