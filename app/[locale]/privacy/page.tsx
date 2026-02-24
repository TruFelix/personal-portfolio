import { getTranslations } from "next-intl/server";
import React from "react";

const Title = (props: React.PropsWithChildren) => <h2 className="text-xl font-bold" {...props} />;
const Heading = (props: React.PropsWithChildren) => <h2 className="text-l font-bold" {...props} />;
const Headline = (props: React.PropsWithChildren) => <h3 className="font-bold mt-3" {...props} />;
const Text = (props: React.PropsWithChildren) => <span className="dark:text-stone-400 block mb-3" {...props}/>;

export default async function Privacy() {
	const tPrivacy = (await getTranslations("privacy")).rich;

	return <div className="p-10 min-h-screen bg-slate-100 dark:bg-stone-900 dark:text-stone-300">
		{tPrivacy("richText", {
			Title: (chunks) => <Title>{chunks}</Title>,
			Heading: (chunks) => <Heading>{chunks}</Heading>,
			Headline: (chunks) => <Headline>{chunks}</Headline>,
			Text: (chunks) => <Text>{chunks}</Text>,
			a: (chunks) => <a className="underline" href={chunks ? ("" + chunks) : undefined}>{chunks}</a>,
			br: () => <br/>,
			Ul: (chunks) => <ul className="mb-3">{chunks}</ul>,
			UlItem: (chunks) => <li className="list-disc list-inside ml-1">{chunks}</li>,
		})}
	</div>
}