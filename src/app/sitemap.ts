import { MetadataRoute } from 'next';
import { RECIPES_DATA } from '@/lib/recipes-data';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://use-it-first.vercel.app';

  const staticRoutes = [
    '',
    '/pantry',
    '/add',
    '/add/manual',
    '/scan',
    '/scan/results',
    '/priority',
    '/recipes',
    '/impact',
    '/about',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  const recipeRoutes = RECIPES_DATA.map((recipe) => ({
    url: `${baseUrl}/recipes/${recipe.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  return [...staticRoutes, ...recipeRoutes];
}
