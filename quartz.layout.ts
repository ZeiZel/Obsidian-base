import { PageLayout, SharedLayout } from './quartz/cfg';
import {
	Head,
	Footer,
	ConditionalRender,
	ArticleTitle,
	ContentMeta,
	TagList,
	Breadcrumbs,
	PageTitle,
	MobileOnly,
	Spacer,
	Flex,
	Search,
	Darkmode,
	ReaderMode,
	Explorer,
	Graph,
	DesktopOnly,
	TableOfContents,
	Backlinks,
} from './quartz/components';

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
	head: Head(),
	header: [],
	afterBody: [Graph(), Backlinks()],
	footer: Footer({
		links: {
			'This repo on GitHub': 'https://github.com/ZeiZel/Obsidian-base',
			'Me on GitHub': 'https://github.com/zoyzeal',
			'Contact with me': 'https://t.me/ZeiZel',
		},
	}),
};
export const defaultContentPageLayout: PageLayout = {
	beforeBody: [
		ConditionalRender({
			component: Breadcrumbs(),
			condition: (page) => page.fileData.slug !== 'index',
		}),
		ArticleTitle(),
		ContentMeta(),
		TagList(),
	],
	left: [
		PageTitle(),
		MobileOnly(Spacer()),
		Flex({
			components: [
				{
					Component: Search(),
					grow: true,
				},
				{ Component: Darkmode() },
				{ Component: ReaderMode() },
			],
		}),
		Explorer(),
	],
	right: [Graph(), DesktopOnly(TableOfContents()), Backlinks()],
};

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
	beforeBody: [Breadcrumbs(), ArticleTitle(), ContentMeta()],
	left: [
		PageTitle(),
		MobileOnly(Spacer()),
		Flex({
			components: [
				{
					Component: Search(),
					grow: true,
				},
				{ Component: Darkmode() },
			],
		}),
		Explorer(),
	],
	right: [],
};
