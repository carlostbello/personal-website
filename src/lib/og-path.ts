/** Where a page's OG card lives. Mirrors the route list in pages/og. */
export function ogPathFor(pathname: string) {
  const clean = pathname.replace(/\.html$/, '').replace(/\/$/, '');
  return `/og${clean === '' ? '/index' : clean}.png`;
}
