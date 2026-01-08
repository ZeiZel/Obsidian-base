import { pathToRoot } from '../util/path';
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from './types';
import { classNames } from '../util/lang';
import type { SVGProps } from 'react';

const SvgComponent = (props: SVGProps<SVGSVGElement>) => (
	<svg
		xmlns='http://www.w3.org/2000/svg'
		xmlSpace='preserve'
		width={40}
		height={40}
		{...props}
	>
		<path
			d='m156.124 0-54.785 54.785h64.992L91.73 129.386l29.003 14.262H67.755V88.959l14.162 32.231 53.665-53.672h-65L138.111 0H.326v210h209.348V0h-53.55zm49.334 205.787H4.542V4.219h123.395L60.411 71.738h64.985L83.301 113.85 69.229 81.83h-5.687v66.033h66.033V143.3l-30.703-15.099 77.629-77.625h-64.985L157.86 4.219h47.599v201.568z'
			style={{
				fill: '#010002',
			}}
		/>
	</svg>
);

const light = (
	<svg id='logo-light'>
		<SvgComponent />
	</svg>
);

const dark = (
	<svg id='logo-dark'>
		<SvgComponent />
	</svg>
);

const Logo: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
	const baseDir = pathToRoot(fileData.slug!);

	return (
		<a class={classNames(displayClass, 'page-logo')} href={baseDir}>
			{light}
			{dark}
		</a>
	);
};

Logo.css = `
:root[saved-theme="dark"] .page-logo {
  & > #logo-light {
    display: none;
  }
  & > #logo-dark {
    display: inline;
  }
}
:root .page-logo {
  & > #logo-light  {
    display: inline;
  }
  & > #logo-dark  {
    display: none;
  }
}
`;

export default (() => Logo) satisfies QuartzComponentConstructor;
