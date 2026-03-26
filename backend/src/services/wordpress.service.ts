import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface WPPost {
  id: number;
  title: string;
  excerpt: string;
  featuredImage: string | null;
  date: string;
  link: string;
}

interface WPCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache: Map<string, CacheEntry<any>> = new Map();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data as T;
  }
  cache.delete(key);
  return null;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

async function getWpApiUrl(): Promise<string> {
  const setting = await prisma.setting.findUnique({ where: { key: 'wordpressApiUrl' } });
  return setting?.value || 'https://cdfeirense.pt/wp-json/wp/v2';
}

export class WordPressService {
  async getPosts(count?: number): Promise<WPPost[]> {
    const wpUrl = await getWpApiUrl();
    const countSetting = await prisma.setting.findUnique({ where: { key: 'newsAutoFetchCount' } });
    const perPage = count || parseInt(countSetting?.value || '10', 10);

    const cacheKey = `wp_posts_${perPage}`;
    const cached = getCached<WPPost[]>(cacheKey);
    if (cached) return cached;

    try {
      const url = `${wpUrl}/posts?per_page=${perPage}&_embed&orderby=date&order=desc`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`WordPress API error: ${response.status}`);
      }

      const rawPosts: any[] = (await response.json()) as any[];

      const posts: WPPost[] = rawPosts.map((post: any) => {
        let featuredImage: string | null = null;
        try {
          featuredImage =
            post._embedded?.['wp:featuredmedia']?.[0]?.media_details?.sizes?.medium?.source_url ||
            post._embedded?.['wp:featuredmedia']?.[0]?.source_url ||
            null;
        } catch {
          // no featured image
        }

        return {
          id: post.id,
          title: post.title?.rendered || '',
          excerpt: post.excerpt?.rendered || '',
          featuredImage,
          date: post.date,
          link: post.link,
        };
      });

      setCache(cacheKey, posts);
      return posts;
    } catch (err: any) {
      console.error('Error fetching WordPress posts:', err.message);
      return [];
    }
  }

  async getPostBySlug(slug: string): Promise<WPPost | null> {
    const wpUrl = await getWpApiUrl();

    const cacheKey = `wp_post_slug_${slug}`;
    const cached = getCached<WPPost>(cacheKey);
    if (cached) return cached;

    try {
      const url = `${wpUrl}/posts?slug=${encodeURIComponent(slug)}&_embed`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`WordPress API error: ${response.status}`);
      }

      const rawPosts: any[] = (await response.json()) as any[];
      if (rawPosts.length === 0) return null;

      const post = rawPosts[0];
      let featuredImage: string | null = null;
      try {
        featuredImage =
          post._embedded?.['wp:featuredmedia']?.[0]?.media_details?.sizes?.large?.source_url ||
          post._embedded?.['wp:featuredmedia']?.[0]?.source_url ||
          null;
      } catch {
        // no featured image
      }

      const result: WPPost = {
        id: post.id,
        title: post.title?.rendered || '',
        excerpt: post.excerpt?.rendered || '',
        featuredImage,
        date: post.date,
        link: post.link,
      };

      setCache(cacheKey, result);
      return result;
    } catch (err: any) {
      console.error('Error fetching WordPress post by slug:', err.message);
      return null;
    }
  }

  async getCategories(): Promise<WPCategory[]> {
    const wpUrl = await getWpApiUrl();

    const cacheKey = 'wp_categories';
    const cached = getCached<WPCategory[]>(cacheKey);
    if (cached) return cached;

    try {
      const url = `${wpUrl}/categories?per_page=100`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`WordPress API error: ${response.status}`);
      }

      const rawCategories: any[] = (await response.json()) as any[];

      const categories: WPCategory[] = rawCategories.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        count: cat.count,
      }));

      setCache(cacheKey, categories);
      return categories;
    } catch (err: any) {
      console.error('Error fetching WordPress categories:', err.message);
      return [];
    }
  }
}
