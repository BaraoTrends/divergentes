import DOMPurify from "dompurify";

/**
 * Sanitize HTML to prevent XSS attacks.
 * Allows safe tags used in blog content.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "br", "hr",
      "ul", "ol", "li",
      "strong", "em", "b", "i", "u", "s", "del", "ins",
      "a", "img",
      "blockquote", "pre", "code",
      "table", "thead", "tbody", "tr", "th", "td",
      "div", "span", "figure", "figcaption",
      "sub", "sup", "mark",
    ],
    ALLOWED_ATTR: [
      "href", "target", "rel", "src", "alt", "title", "width", "height",
      "class", "id", "loading", "decoding",
    ],
    ADD_ATTR: ["target"],
  });
}
