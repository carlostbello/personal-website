'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Github, ExternalLink } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { ProjectWithTags } from '@/lib/supabase/types'

interface FeaturedProjectsProps {
  projects: ProjectWithTags[]
}

export function FeaturedProjects({ projects }: FeaturedProjectsProps) {
  if (projects.length === 0) {
    return null
  }

  return (
    <section className="container px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-12 text-center"
      >
        <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Featured Projects
        </h2>
        <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
          Here are some of the projects I&apos;ve been working on recently.
        </p>
      </motion.div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
          >
            <Card className="flex h-full flex-col overflow-hidden transition-all hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10">
              {/* Image placeholder if no image */}
              <div className="bg-muted aspect-video w-full">
                {/* TODO: Add Next.js Image component when images are available */}
                <div className="text-muted-foreground flex h-full items-center justify-center">
                  {project.title}
                </div>
              </div>

              <CardHeader>
                <CardTitle className="line-clamp-1">{project.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {project.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-grow">
                <div className="flex flex-wrap gap-2">
                  {project.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag.id}
                      className="bg-secondary text-secondary-foreground rounded-md px-2 py-1 text-xs"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="flex gap-2">
                {project.website_url && (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <a
                      href={project.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Visit Site <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                )}
                {project.github_url && (
                  <Button asChild variant="ghost" size="icon">
                    <a
                      href={project.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="GitHub"
                    >
                      <Github className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Button asChild size="lg" className="glow-button">
          <Link href="/projects">
            View All Projects <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  )
}
