import type { Metadata } from 'next'
import Link from 'next/link'
import { Calendar, Clock, Tag } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getPublishedBlogPosts } from '@/lib/supabase'

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Thoughts, tutorials, and insights on software development and technology.',
}

export default async function BlogPage() {
  const posts = await getPublishedBlogPosts()

  return (
    <div className="container px-4 py-16">
      {/* Hero Section */}
      <section className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Blog
        </h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
          Thoughts, tutorials, and insights on software development, technology,
          and continuous learning.
        </p>
      </section>

      {/* Blog Posts */}
      <section>
        {posts.length === 0 ? (
          <div className="text-muted-foreground py-16 text-center">
            <p>No blog posts yet. Check back soon!</p>
          </div>
        ) : (
          <div className="mx-auto max-w-4xl space-y-8">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="block"
              >
                <Card className="group transition-all hover:shadow-lg hover:shadow-cyan-500/10">
                  <CardHeader>
                    <div className="text-muted-foreground mb-2 flex flex-wrap items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(
                          post.published_at || post.created_at
                        ).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {Math.ceil(post.content.split(' ').length / 200)} min
                        read
                      </span>
                    </div>
                    <CardTitle className="text-2xl transition-colors group-hover:text-cyan-500">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {post.excerpt}
                    </CardDescription>
                  </CardHeader>
                  {post.tags && post.tags.length > 0 && (
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        <Tag className="text-muted-foreground h-4 w-4" />
                        {post.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="bg-muted text-muted-foreground rounded-md px-2 py-1 text-xs"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
