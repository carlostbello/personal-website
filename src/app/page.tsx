'use client'

import Link from 'next/link'
import { User, Code, Lightbulb, Github, Linkedin, Mail } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { TypeAnimation } from 'react-type-animation'
import { siteConfig } from '@/lib/config'

export default function Home() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      {/* Circuit Board Background */}
      <div className="circuit-bg absolute inset-0 -z-10" />

      <div className="container relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-16">
        {/* Hero Section with Name */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 text-center"
        >
          <h1 className="hero-title-embossed mb-6 text-5xl font-bold tracking-wider sm:text-6xl md:text-7xl lg:text-8xl">
            Carlos Bello
          </h1>
        </motion.div>

        {/* Terminal/Code Intro Section with Typing Animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-12 w-full max-w-2xl"
        >
          <div className="rounded-lg border border-cyan-500/30 bg-background/80 p-6 backdrop-blur-sm shadow-lg shadow-cyan-500/10">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="text-muted-foreground ml-2 text-xs font-mono">
                ~/portfolio
              </span>
            </div>
            <div className="font-mono text-sm leading-relaxed text-white">
              <TypeAnimation
                sequence={[
                  "> Hey, I'm Carlos. I like finding easier, smarter ways to get things done, whether I'm building, learning, or creating something new. I like turning ideas into things that people find useful. If you find this interesting, check out what I'm working on below.",
                  1000,
                ]}
                wrapper="pre"
                speed={75}
                className="whitespace-pre-wrap"
                repeat={0}
                cursor={true}
              />
            </div>
          </div>
        </motion.div>

        {/* Three Cards Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-12 grid w-full max-w-5xl grid-cols-1 gap-8 sm:grid-cols-3"
        >
          {/* Card 1: I am */}
          <Link href="/about" className="group block">
            <motion.div
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="button-card relative flex h-full flex-col items-center justify-center rounded-lg border-2 border-cyan-500/40 bg-background/60 p-8 backdrop-blur-sm transition-all hover:border-cyan-400 hover:bg-cyan-500/5 hover:shadow-xl hover:shadow-cyan-500/30"
            >
              <div className="mb-4 rounded-full border-2 border-cyan-500/50 p-4 transition-all group-hover:border-cyan-400 group-hover:shadow-lg group-hover:shadow-cyan-500/40">
                <User className="h-8 w-8 text-cyan-400" />
              </div>
              <h2 className="mb-2 text-xl font-bold sm:text-2xl">I am</h2>
              <p className="text-muted-foreground text-center text-sm">
                About me & my journey
              </p>
            </motion.div>
          </Link>

          {/* Card 2: I build */}
          <Link href="/projects" className="group block">
            <motion.div
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="button-card relative flex h-full flex-col items-center justify-center rounded-lg border-2 border-cyan-500/40 bg-background/60 p-8 backdrop-blur-sm transition-all hover:border-cyan-400 hover:bg-cyan-500/5 hover:shadow-xl hover:shadow-cyan-500/30"
            >
              <div className="mb-4 rounded-full border-2 border-cyan-500/50 p-4 transition-all group-hover:border-cyan-400 group-hover:shadow-lg group-hover:shadow-cyan-500/40">
                <Code className="h-8 w-8 text-cyan-400" />
              </div>
              <h2 className="mb-2 text-xl font-bold sm:text-2xl">I build</h2>
              <p className="text-muted-foreground text-center text-sm">
                Projects & creations
              </p>
            </motion.div>
          </Link>

          {/* Card 3: I think */}
          <Link href="/blog" className="group block">
            <motion.div
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="button-card relative flex h-full flex-col items-center justify-center rounded-lg border-2 border-cyan-500/40 bg-background/60 p-8 backdrop-blur-sm transition-all hover:border-cyan-400 hover:bg-cyan-500/5 hover:shadow-xl hover:shadow-cyan-500/30"
            >
              <div className="mb-4 rounded-full border-2 border-cyan-500/50 p-4 transition-all group-hover:border-cyan-400 group-hover:shadow-lg group-hover:shadow-cyan-500/40">
                <Lightbulb className="h-8 w-8 text-cyan-400" />
              </div>
              <h2 className="mb-2 text-xl font-bold sm:text-2xl">I think</h2>
              <p className="text-muted-foreground text-center text-sm">
                Writing & reflections
              </p>
            </motion.div>
          </Link>
        </motion.div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center"
        >
          <p className="text-muted-foreground mb-6 text-sm sm:text-base">
            Want to work with me, chat about projects, or just say hi?
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild variant="outline" className="glow-button w-full sm:w-auto">
              <a
                href={siteConfig.social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin className="mr-2 h-4 w-4" />
                LinkedIn
              </a>
            </Button>
            <Button asChild variant="outline" className="glow-button w-full sm:w-auto">
              <a href={siteConfig.social.email}>
                <Mail className="mr-2 h-4 w-4" />
                Email
              </a>
            </Button>
            <Button asChild variant="outline" className="glow-button w-full sm:w-auto">
              <a
                href={siteConfig.social.github}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="mr-2 h-4 w-4" />
                GitHub
              </a>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
