import { TITLE_TAILWIND_CLASS } from '@/utils/constants'
import Image from 'next/image'
import Link from "next/link"

export default function BlogSample() {
  const articles = [
    {
      id: 1,
      image: "/placeholder.svg",
      title: "7 Proven Lead Generation Strategies for Real Estate Success",
      description: "Learn the most effective techniques to generate and nurture quality leads in today's competitive market.",
      date: "2024-01-15"
    },
    {
      id: 2,
      image: "/placeholder.svg",
      title: "Breaking Into the Luxury Real Estate Market: A Complete Guide",
      description: "Expert insights on how to establish yourself in the high-end property market and close bigger deals.",
      date: "2024-01-22"
    },
    {
      id: 3,
      image: "/placeholder.svg",
      title: "Digital Marketing Essentials for Modern Real Estate Agents",
      description: "Master social media, content marketing, and online presence to attract more clients and grow your business.",
      date: "2024-01-29"
    }
  ]

  return (
    <div className="flex flex-col justify-center items-center">
      <div className='flex flex-col items-center p-3 w-full'>
        <div className='flex flex-col justify-start items-center gap-2 w-full'>
          <div className='flex gap-3 justify-start items-center w-full'>
            <h2 className={`${TITLE_TAILWIND_CLASS} mt-2 font-semibold tracking-tight dark:text-white text-gray-900`}>
              Latest Insights from Top Real Estate Coaches
            </h2>
          </div>
          <div className='flex gap-3 justify-start items-center w-full border-b pb-4'>
            <p className="text-gray-600 dark:text-gray-400">
              Expert advice and strategies to help you excel in your real estate career
            </p>
          </div>
        </div>
      </div>
      <div className='flex flex-col items-start w-full'>
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-5 w-full">
          {articles?.map((article) => (
            <Link href={"/blog/" + article.id} key={article?.id}>
              <article className="flex flex-col space-y-3 p-4 rounded-lg border hover:border-blue-500 transition-colors dark:bg-black h-full">
                <div className="aspect-video relative rounded-md border bg-muted overflow-hidden">
                  <Image
                    src={article?.image}
                    alt={article.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className='flex flex-col gap-2'>
                  <h3 className="text-lg font-bold line-clamp-2 hover:text-blue-600 transition-colors">
                    {article?.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {article.description}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground mt-auto">
                  {new Date(article?.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </article>
            </Link>
          ))}
        </div>
        <div className="w-full text-center mt-8">
          <Link href="/blog" className="text-blue-600 hover:text-blue-700 font-semibold">
            View All Articles →
          </Link>
        </div>
      </div>
    </div>
  )
}
