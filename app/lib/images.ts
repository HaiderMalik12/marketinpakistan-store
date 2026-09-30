// Cloudinary URLs get on-the-fly resizing/format so full-size phone photos
// are not served to customers. Non-Cloudinary URLs pass through unchanged.
export function optimizedImage(url: string, width = 800): string {
  const marker = "/image/upload/";
  const i = url.indexOf(marker);
  if (!url.includes("res.cloudinary.com") || i === -1) return url;
  const rest = url.slice(i + marker.length);
  if (/^(f_|q_|w_|c_)/.test(rest)) return url; // already transformed
  return `${url.slice(0, i + marker.length)}f_auto,q_auto,w_${width}/${rest}`;
}
