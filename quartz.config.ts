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
				header: 'Schibsted Grotesk',
				body: 'Source Sans Pro',
				code: 'IBM Plex Mono',
			},
			colors: {
				lightMode: {
					light: '#f2e5bc', // Gruvbox Material Light Soft - background
					lightgray: '#ebdbb2', // Surface
					gray: '#a89984', // Gray text
					darkgray: '#654735', // Main text (brown)
					dark: '#3c3836', // Dark brown for emphasis
					secondary: '#427b58', // Green for links
					tertiary: '#45707a', // Blue-teal for visited/accents
					highlight: 'rgba(124, 111, 100, 0.15)', // Warm brown translucent
					textHighlight: '#d8a65788', // Warm yellow highlight
				},
				darkMode: {
					light: '#32302f', // Gruvbox Material Dark Soft - background
					lightgray: '#3c3836', // Surface (code background)
					gray: '#7c6f64', // Subdued text
					darkgray: '#d4be98', // Main text (warm beige)
					dark: '#ddc7a1', // Emphasized text
					secondary: '#a9b665', // Green for links
					tertiary: '#7daea3', // Aqua for visited/accents
					highlight: 'rgba(169, 182, 101, 0.15)', // Green translucent
					textHighlight: '#d8a65788', // Warm yellow highlight
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
