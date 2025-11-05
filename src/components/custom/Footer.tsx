import Link from 'next/link'
import { Github, Linkedin, Twitter, Mail } from 'lucide-react'

const navigation = {
  main: [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Projects', href: '/projects' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' },
  ],
  social: [
    {
      name: 'GitHub',
      href: 'https://github.com/carlostbello',
      icon: Github,
    },
    {
      name: 'LinkedIn',
      href: 'https://linkedin.com/in/carlostbello',
      icon: Linkedin,
    },
    {
      name: 'Twitter',
      href: 'https://twitter.com/carlostbello',
      icon: Twitter,
    },
    {
      name: 'Email',
      href: 'mailto:hello@carlostbello.com',
      icon: Mail,
    },
  ],
}

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-background border-t">
      <div className="container px-4 py-12">
        {/* Navigation Links */}
        <nav className="mb-8 flex flex-wrap justify-center gap-x-8 gap-y-4">
          {navigation.main.map((item) => (
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
          {navigation.social.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
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
          &copy; {currentYear} Carlos Bello. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
