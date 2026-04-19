type PageMetaConfig = {
  title: string;
  description: string;
  themeColor?: string;
};

const DEFAULT_THEME_COLOR = "#8b1120";

export function setPageMeta({
  title,
  description,
  themeColor = DEFAULT_THEME_COLOR,
}: PageMetaConfig) {
  if (typeof document === "undefined") {
    return;
  }

  document.title = title;

  const ensureMeta = (
    selector: string,
    attribute: "name" | "property",
    value: string,
    content: string
  ) => {
    let element = document.head.querySelector<HTMLMetaElement>(selector);

    if (!element) {
      element = document.createElement("meta");
      element.setAttribute(attribute, value);
      document.head.appendChild(element);
    }

    element.setAttribute("content", content);
  };

  ensureMeta('meta[name="description"]', "name", "description", description);
  ensureMeta(
    'meta[property="og:description"]',
    "property",
    "og:description",
    description
  );
  ensureMeta('meta[name="theme-color"]', "name", "theme-color", themeColor);
  ensureMeta('meta[property="og:title"]', "property", "og:title", title);
}

