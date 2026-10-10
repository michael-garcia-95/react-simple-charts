// Vite replaces BASE_URL for both development and static production builds.
export const navigation = [
  { id: 'home', label: 'Home', href: '/' },
  { id: 'examples', label: 'Examples', href: '/examples/' },
  { id: 'documentation', label: 'Documentation', href: '/documentation/' },
  { id: 'about', label: 'About', href: '/about/' },
] as const;
export type Page = (typeof navigation)[number]['id'];
export type SitePage = Page | 'not-found';
export function sitePath(
  path: string,
  base = import.meta.env.BASE_URL,
): string {
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  return `${base}${path.slice(1)}`;
}
export function pageFromPath(
  path: string,
  base = import.meta.env.BASE_URL,
): SitePage {
  const baseRoot = base === '/' ? '' : base.slice(0, -1);
  if (path !== baseRoot && !path.startsWith(base)) return 'not-found';
  const local = path.slice(baseRoot.length) || '/';
  const normalized =
    local.replace(/\/index\.html$/, '/').replace(/\/$/, '') || '/';
  return (
    navigation.find(
      (item) => (item.href.replace(/\/$/, '') || '/') === normalized,
    )?.id ?? 'not-found'
  );
}
