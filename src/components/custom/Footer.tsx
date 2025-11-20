import Link from 'next/link'
import { Github, Linkedin, Twitter, Mail } from 'lucide-react'
import { siteConfig } from '@/lib/config'

const socialIcons = {
  github: Github,
  linkedin: Linkedin,
  twitter: Twitter,
  email: Mail,
}

export function Footer() {
  const currentYear = new Date().getFullYear()

  const socialLinks = [
    {
      name: 'GitHub',
      href: siteConfig.social.github,
      icon: socialIcons.github,
      external: true,
    },
    {
      name: 'LinkedIn',
      href: siteConfig.social.linkedin,
      icon: socialIcons.linkedin,
      external: true,
    },
    {
      name: 'Twitter',
      href: siteConfig.social.twitter,
      icon: socialIcons.twitter,
      external: true,
    },
    {
      name: 'Contact',
      href: siteConfig.social.email,
      icon: socialIcons.email,
      external: false,
    },
  ]

  return (
    <footer className="bg-background border-t">
      <div className="container px-4 py-12">
        {/* Navigation Links */}
        <nav className="mb-8 flex flex-wrap justify-center gap-x-8 gap-y-4">
          {siteConfig.navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Social Links */}
        <div className="mb-8 flex justify-center gap-6">
          {socialLinks.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                {...(item.external && {
                  target: '_blank',
                  rel: 'noopener noreferrer',
                })}
                className="text-muted-foreground hover:text-foreground"
                aria-label={item.name}
              >
                <Icon className="h-5 w-5" />
              </Link>
            )
          })}
        </div>

        {/* Copyright */}
        <p className="text-muted-foreground text-center text-sm">
          &copy; {currentYear} {siteConfig.name}. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
