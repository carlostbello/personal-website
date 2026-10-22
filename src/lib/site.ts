export const site = {
  name: 'Carlos Bello',
  url: 'https://carlostbello.com',
  description: 'TK one-line description used for search results and link previews.',
  email: 'hi@carlostbello.com',
  social: {
    github: 'https://github.com/carlostbello',
    linkedin: 'https://www.linkedin.com/in/carlos-t-bello/',
  },
  // Set to your Buttondown username to show the signup form on the log.
  newsletter: { buttondown: '' },
  // Cloudflare Web Analytics token (dashboard > Web Analytics). Empty = off.
  analytics: { cloudflareToken: '' },
  // Substack publication URL, linked from the log once set. Full posts
  // stay here; Substack gets excerpts that link back.
  substack: '',
  nav: [
    { label: 'Projects', href: '/projects' },
    { label: 'Log', href: '/log' },
    { label: 'Talks', href: '/talks' },
  ],
} as const;
