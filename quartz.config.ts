import { QuartzConfig } from './quartz/cfg';
import {
	AliasRedirects,
	Assets,
	ComponentResources,
	ContentIndex,
	ContentPage,
	CrawlLinks,
	CreatedModifiedDate,
	CustomOgImages,
	Description,
	Favicon,
	FolderPage,
	FrontMatter,
	GitHubFlavoredMarkdown,
	Latex,
	NotFoundPage,
	ObsidianFlavoredMarkdown,
	RemoveDrafts,
	Static,
	SyntaxHighlighting,
	TableOfContents,
	TagPage,
} from './quartz/plugins';
import { customImageStructure } from './quartz/util/og';

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
	configuration: {
		pageTitle: 'Base',
		pageTitleSuffix: '',
		enableSPA: true,
		enablePopovers: true,
		analytics: {
			provider: 'plausible',
		},
		locale: 'ru-RU',
		baseUrl: 'https://zeizel.github.io/Obsidian-base/',
		ignorePatterns: ['private', 'templates', '.obsidian'],
		defaultDateType: 'modified',
		theme: {
			fontOrigin: 'googleFonts',
			cdnCaching: true,
			typography: {
				header: 'Inter',
				body: 'Inter',
				code: 'JetBrains Mono',
			},
			colors: {
				lightMode: {
					light: '#faf8f5',
					lightgray: '#f0ece4',
					gray: '#a09890',
					darkgray: '#4a4540',
					dark: '#2e2a26',
					secondary: '#5b7ea6',
					tertiary: '#7a6fa0',
					highlight: 'rgba(91, 126, 166, 0.10)',
					textHighlight: 'rgba(210, 160, 60, 0.35)',
				},
				darkMode: {
					light: '#1c1917',
					lightgray: '#292524',
					gray: '#78716c',
					darkgray: '#d6d0c8',
					dark: '#eae6df',
					secondary: '#7aa2c8',
					tertiary: '#a594c8',
					highlight: 'rgba(122, 162, 200, 0.12)',
					textHighlight: 'rgba(210, 160, 60, 0.25)',
				},
			},
		},
	},
	plugins: {
		transformers: [
			FrontMatter(),
			CreatedModifiedDate({
				priority: ['frontmatter', 'git', 'filesystem'],
			}),
			SyntaxHighlighting({
				keepBackground: false,
				theme: {
					light: 'github-light',
					dark: 'github-dark',
				},
			}),
			ObsidianFlavoredMarkdown({ enableInHtmlEmbed: true }),
			GitHubFlavoredMarkdown(),
			TableOfContents(),
			CrawlLinks({ markdownLinkResolution: 'shortest', lazyLoad: true }),
			Description(),
			Latex({ renderEngine: 'katex' }),
		],
		filters: [
			RemoveDrafts(),
			// ExplicitPublish()
		],
		emitters: [
			AliasRedirects(),
			ComponentResources(),
			ContentPage(),
			FolderPage(),
			TagPage(),
			ContentIndex({
				enableSiteMap: true,
				enableRSS: true,
				rssFullHtml: true,
				rssLimit: 50,
			}),
			Assets(),
			Static(),
			Favicon(),
			NotFoundPage(),
			CustomOgImages({
				colorScheme: 'lightMode',
				width: 1200,
				height: 630,
				excludeRoot: false,
				imageStructure: customImageStructure,
			}),
		],
	},
};

export default config;
