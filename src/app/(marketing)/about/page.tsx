import type { Metadata } from 'next'
import { User, Code, Lightbulb, Heart } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Learn more about Carlos Bello - Software Developer, creator, and lifelong learner.',
}

export default function AboutPage() {
  return (
    <div className="container px-4 py-16">
      {/* Hero Section */}
      <section className="mb-16 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          About Me
        </h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
          {/* TODO: Replace with real bio */}
          Software developer passionate about building elegant solutions to
          complex problems. I love learning new technologies and sharing
          knowledge with the community.
        </p>
      </section>

      {/* Story Section */}
      <section className="mb-16">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              My Journey
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            {/* TODO: Replace with real story */}
            <p>
              I started my journey in software development with a curiosity
              about how things work under the hood. What began as tinkering with
              code quickly evolved into a passion for creating meaningful
              digital experiences.
            </p>
            <p>
              Over the years, I&apos;ve worked on various projects spanning web
              development, mobile apps, and developer tools. Each project has
              taught me something new and reinforced my belief that the best
              code is code that solves real problems for real people.
            </p>
            <p>
              When I&apos;m not coding, you can find me exploring new
              technologies, contributing to open source, or sharing what
              I&apos;ve learned through writing and teaching.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Skills Grid */}
      <section className="mb-16">
        <h2 className="mb-8 text-3xl font-bold">Skills & Technologies</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Frontend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5 text-cyan-500" />
                Frontend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-muted-foreground space-y-2">
                {/* TODO: Replace with real skills */}
                <li>React / Next.js</li>
                <li>TypeScript</li>
                <li>Tailwind CSS</li>
                <li>Framer Motion</li>
              </ul>
            </CardContent>
          </Card>

          {/* Backend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5 text-green-500" />
                Backend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-muted-foreground space-y-2">
                {/* TODO: Replace with real skills */}
                <li>Node.js</li>
                <li>Python</li>
                <li>PostgreSQL</li>
                <li>REST APIs</li>
              </ul>
            </CardContent>
          </Card>

          {/* Tools */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Tools & Practices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-muted-foreground space-y-2">
                {/* TODO: Replace with real tools */}
                <li>Git & GitHub</li>
                <li>VS Code</li>
                <li>Docker</li>
                <li>Agile/Scrum</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Interests/Values */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              What I Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* TODO: Replace with real values */}
              <div>
                <h3 className="mb-2 font-semibold">Clean Code</h3>
                <p className="text-muted-foreground text-sm">
                  Writing code that is maintainable, readable, and efficient.
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">User Experience</h3>
                <p className="text-muted-foreground text-sm">
                  Creating interfaces that are intuitive and delightful to use.
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">Continuous Learning</h3>
                <p className="text-muted-foreground text-sm">
                  Staying curious and always looking for ways to improve.
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">Open Source</h3>
                <p className="text-muted-foreground text-sm">
                  Contributing to and supporting the open source community.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
