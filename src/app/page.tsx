'use client'

import Link from 'next/link'
import { ArrowRight, Github, Linkedin, Mail } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

const codeLines = [
  '> initializing portfolio...',
  '> loading developer profile...',
  '> const developer = {',
  '>   name: "Carlos Bello",',
  '>   role: "Software Developer",',
  '>   passion: "Building great experiences"',
  '> }',
  '> developer.introduce()',
]

export default function Home() {
  const [displayedCode, setDisplayedCode] = useState('')
  const [currentLine, setCurrentLine] = useState(0)
  const [showCursor, setShowCursor] = useState(true)

  useEffect(() => {
    if (currentLine >= codeLines.length) return

    const line = codeLines[currentLine]
    let charIndex = 0

    const typingInterval = setInterval(() => {
      if (charIndex <= line.length) {
        setDisplayedCode((prev) => prev + line[charIndex])
        charIndex++
      } else {
        clearInterval(typingInterval)
        setDisplayedCode((prev) => prev + '\n')
        setTimeout(() => setCurrentLine((prev) => prev + 1), 300)
      }
    }, 50)

    return () => clearInterval(typingInterval)
  }, [currentLine])

  // Cursor blink effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev)
    }, 530)
    return () => clearInterval(cursorInterval)
  }, [])

  return (
    <div className="flex flex-col">
      {/* Hero Section with Gradient Background */}
      <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="gradient-bg absolute inset-0 -z-10" />

        <div className="relative container flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-16">
          {/* Terminal/Code Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 w-full max-w-2xl"
          >
            <div className="bg-background/95 rounded-lg border p-6 shadow-2xl backdrop-blur-sm">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-muted-foreground ml-2 text-xs">
                  ~/portfolio
                </span>
              </div>
              <pre className="font-mono text-sm leading-relaxed">
                <code>
                  {displayedCode}
                  <span
                    className={`bg-primary inline-block h-4 w-2 ${showCursor ? 'opacity-100' : 'opacity-0'}`}
                  />
                </code>
              </pre>
            </div>
          </motion.div>

          {/* Name Highlight */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{
              opacity: currentLine >= 3 ? 1 : 0,
              scale: currentLine >= 3 ? 1 : 0.9,
            }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-8 text-center"
          >
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Carlos Bello
              </span>
            </h1>
            <p className="text-muted-foreground mt-2 text-lg sm:text-xl">
              Full Stack Developer
            </p>
          </motion.div>

          {/* Scroll-triggered Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: currentLine >= 7 ? 1 : 0,
              y: currentLine >= 7 ? 0 : 20,
            }}
            transition={{ duration: 0.6 }}
            className="mb-8 max-w-2xl text-center"
          >
            <p className="text-muted-foreground text-lg sm:text-xl">
              Building modern web applications with clean code, great UX, and a
              passion for continuous learning.
            </p>
          </motion.div>

          {/* CTA Buttons with Stagger */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: currentLine >= 7 ? 1 : 0,
              y: currentLine >= 7 ? 0 : 20,
            }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/projects">
                View My Work
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
            >
              <Link href="/contact">Contact Me</Link>
            </Button>
          </motion.div>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: currentLine >= 7 ? 1 : 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex items-center justify-center gap-4"
          >
            <a
              href="https://github.com/carlostbello"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="GitHub"
            >
              <Github className="h-6 w-6" />
            </a>
            <a
              href="https://linkedin.com/in/carlostbello"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-6 w-6" />
            </a>
            <a
              href="mailto:hello@carlostbello.com"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Email"
            >
              <Mail className="h-6 w-6" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Quick Intro Section with Scroll Animation */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
        className="bg-muted/50 border-t py-16"
      >
        <div className="container px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-2xl font-bold sm:text-3xl">
              Building Digital Experiences
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
              I specialize in creating responsive, performant, and accessible
              web applications using modern technologies like Next.js, React,
              and TypeScript. Always learning, always building.
            </p>
          </div>
        </div>
      </motion.section>
    </div>
  )
}
