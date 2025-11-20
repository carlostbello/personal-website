import { HeroSection } from '@/components/custom/HeroSection'
import { FeaturedProjects } from '@/components/custom/FeaturedProjects'
import { getFeaturedProjects } from '@/lib/supabase/queries'

export const revalidate = 3600 // Revalidate every hour

export default async function Home() {
  const featuredProjects = await getFeaturedProjects()

  return (
    <main className="flex min-h-screen flex-col">
      <HeroSection />
      <FeaturedProjects projects={featuredProjects} />
    </main>
  )
}
