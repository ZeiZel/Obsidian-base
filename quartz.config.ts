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
		pageTitle: 'Digital garden 🌲',
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
				header: 'Schibsted Grotesk',
				body: 'Source Sans Pro',
				code: 'IBM Plex Mono',
			},
			colors: {
				lightMode: {
					light: '#eff1f5', // Base (Latte variant)
					lightgray: '#e6e9ef', // Surface0
					gray: '#9ca0b0', // Subtext0
					darkgray: '#4c4f69', // Text
					dark: '#4c4f69', // Code text
					secondary: '#1e66f5', // Links, title (Blue Latte)
					tertiary: '#7287fd', // Visited nodes (Lavender Latte)
					highlight: 'rgba(180, 190, 254, 0.15)', // Lavender translucent
					textHighlight: '#f9e2af88', // Yellow highlight
				},
				darkMode: {
					light: '#1e1e2e', // Base
					lightgray: '#313244', // Surface0 (code background)
					gray: '#a6adc8', // Subtext0
					darkgray: '#cdd6f4', // Text
					dark: '#cdd6f4', // Code text
					secondary: '#89b4fa', // Links, title (Blue)
					tertiary: '#b4befe', // Visited nodes (Lavender)
					highlight: 'rgba(137, 180, 250, 0.15)', // Blue translucent
					textHighlight: '#f9e2af88', // Yellow highlight
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
