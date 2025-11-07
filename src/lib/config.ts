/**
 * Centralized configuration for site-wide information
 * Update URLs and personal info here to reflect across the entire site
 */

export const siteConfig = {
  name: 'Carlos Bello',
  author: 'Carlos Bello',
  description:
    'Personal website and portfolio of Carlos Bello - Software Developer',

  // Social Links
  social: {
    github: 'https://github.com/carlostbello',
    linkedin: 'https://www.linkedin.com/in/carlos-t-bello/',
    twitter: 'https://twitter.com/carlostbello',
    email: 'mailto:hello@carlostbello.com',
    emailAddress: 'hello@carlostbello.com', // For display purposes
  },

  // Navigation Links
  navigation: [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Projects', href: '/projects' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' },
  ],

  // URLs
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3000',
} as const

export type SiteConfig = typeof siteConfig
