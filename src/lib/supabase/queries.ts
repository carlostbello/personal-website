import { createServerClient } from './server'
import type { Tag, ProjectWithTags, BlogPostWithTags } from './types'

/**
 * Get all published projects with their tags
 */
export async function getPublishedProjects(): Promise<ProjectWithTags[]> {
  const supabase = createServerClient()

  const { data: projects, error } = await supabase
    .from('projects')
    .select(
      `
      *,
      project_tags (
        tags (*)
      )
    `
    )
    .eq('published', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching projects:', error)
    return []
  }

  // Transform the data to include tags array
  return projects.map((project) => ({
    ...project,
    tags: project.project_tags?.map((pt: { tags: Tag }) => pt.tags) || [],
  }))
}

/**
 * Get a single project by slug
 */
export async function getProjectBySlug(
  slug: string
): Promise<ProjectWithTags | null> {
  const supabase = createServerClient()

  const { data: project, error } = await supabase
    .from('projects')
    .select(
      `
      *,
      project_tags (
        tags (*)
      )
    `
    )
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (error) {
    console.error('Error fetching project:', error)
    return null
  }

  return {
    ...project,
    tags: project.project_tags?.map((pt: { tags: Tag }) => pt.tags) || [],
  }
}

/**
 * Get all published blog posts with their tags
 */
export async function getPublishedBlogPosts(): Promise<BlogPostWithTags[]> {
  const supabase = createServerClient()

  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select(
      `
      *,
      post_tags (
        tags (*)
      )
    `
    )
    .eq('published', true)
    .order('published_at', { ascending: false })

  if (error) {
    console.error('Error fetching blog posts:', error)
    return []
  }

  return posts.map((post) => ({
    ...post,
    tags: post.post_tags?.map((pt: { tags: Tag }) => pt.tags) || [],
  }))
}

/**
 * Get a single blog post by slug
 */
export async function getBlogPostBySlug(
  slug: string
): Promise<BlogPostWithTags | null> {
  const supabase = createServerClient()

  const { data: post, error } = await supabase
    .from('blog_posts')
    .select(
      `
      *,
      post_tags (
        tags (*)
      )
    `
    )
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (error) {
    console.error('Error fetching blog post:', error)
    return null
  }

  return {
    ...post,
    tags: post.post_tags?.map((pt: { tags: Tag }) => pt.tags) || [],
  }
}

/**
 * Get all tags
 */
export async function getAllTags(): Promise<Tag[]> {
  const supabase = createServerClient()

  const { data: tags, error } = await supabase
    .from('tags')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching tags:', error)
    return []
  }

  return tags
}

/**
 * Get featured projects
 */
export async function getFeaturedProjects(): Promise<ProjectWithTags[]> {
  const supabase = createServerClient()

  const { data: projects, error } = await supabase
    .from('projects')
    .select(
      `
      *,
      project_tags (
        tags (*)
      )
    `
    )
    .eq('published', true)
    .eq('featured', true)
    .order('created_at', { ascending: false })
    .limit(3)

  if (error) {
    console.error('Error fetching featured projects:', error)
    return []
  }

  return projects.map((project) => ({
    ...project,
    tags: project.project_tags?.map((pt: { tags: Tag }) => pt.tags) || [],
  }))
}
