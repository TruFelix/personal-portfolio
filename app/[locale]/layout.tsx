import { Locale } from "next-intl";
import { InternationalizationLayout } from "../layout";

export default async function Layout(props: LayoutProps<"/[locale]">) {
	const { locale } = await props.params;

	return <InternationalizationLayout {...props} locale={locale as Locale} />
}