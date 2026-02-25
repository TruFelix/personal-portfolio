import { getTranslations } from "next-intl/server";
import Link from "next/link";
import React from "react";

export default async function MusicLayout({ children }: React.PropsWithChildren) {
	const t = await getTranslations();

	const mail = "trutschnigfelix@gmail.com";

	return <>
		{children}
		<footer className="flex justify-center pb-10 p-3 px-6 md:px-16 py-6 md:pt-10 bg-zinc-500 h-100px w-full text-stone-300 inset-shadow-neutral-50">
			<div className="sheet max-w-4xl grow-1 grid grid-cols-1 md:grid-cols-2 gap-3">
				<div className="text-stone-200">
					<p className="mb-0 leading-4 text-[18px]">Felix Trutschnig</p>
					<a className="underline hover:no-underline" href={`mailto:${mail}`}>{mail}</a>
				</div>
				<div className="row-start-2">
					<Link href="/imprint">{t("imprint.imprint")}</Link>
				</div>
				<div className="md:row-start-2">
					<Link href="/privacy">{t("privacy.privacy")}</Link>
				</div>
				<div className="md:col-span-2 mt-3">
					{t("createdBy")}
				</div>
			</div>
		</footer>
	</>
}