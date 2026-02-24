import { getTranslations } from "next-intl/server";
import React from "react";

interface TextProps extends React.PropsWithChildren {
	children: string | null | undefined;
}

const Heading = (props: React.PropsWithChildren) => <h2 className="text-xl font-bold" {...props} />;
const Headline = (props: React.PropsWithChildren) => <h3 className="font-bold mt-3" {...props} />;
const Text = (props: TextProps) => <span className="dark:text-stone-400" {...props}>{props?.children?.split("\n").map((c, i) => <p key={i} className="leading-5">{c}</p>)}</span>;

export default async function Imprint() {
	const tImprint = await getTranslations("imprint");

	return <div className="p-10 min-h-screen bg-slate-100 dark:bg-stone-900 dark:text-stone-300">
		<Heading>{tImprint("headline")}</Heading>
		<Headline>{tImprint("ownerAndResidenceHeadline")}</Headline>
		<Text>{tImprint("ownerAndResidence")}</Text>
		<Headline>{tImprint("contactHeadline")}</Headline>
		<Text>{tImprint("contact")}</Text>
		<Headline>{tImprint("purposeHeadline")}</Headline>
		<Text>{tImprint("purpose")}</Text>
	</div>
}