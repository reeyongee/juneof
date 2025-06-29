/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || "https://www.juneof.com",
  generateRobotsTxt: true, // (optional)
  // ...other options
  exclude: [
    "/admin",
    "/admin/*",
    "/cart-persistence-demo",
    "/cart-persistence-demo/*",
    "/preload-demo",
    "/preload-demo/*",
    "/auth-test",
    "/auth-test/*",
    "/shopify-test",
    "/shopify-test/*",
    "/dashboard",
    "/dashboard/*",
    "/api/*",
    "/auth/callback-handler",
    "/auth/error",
    "/auth/success",
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        disallow: [
          "/admin",
          "/api",
          "/auth/callback-handler",
          "/auth/error",
          "/dashboard",
        ],
      },
    ],
    additionalSitemaps: ["https://www.juneof.com/sitemap.xml"],
  },
  changefreq: "weekly",
  priority: 0.7,
  sitemapSize: 5000,
  generateIndexSitemap: false,
  transform: async (config, path) => {
    // Custom priority for different page types
    if (path === "/") {
      return {
        loc: path,
        changefreq: "daily",
        priority: 1.0,
        lastmod: new Date().toISOString(),
      };
    }

    if (path.includes("/product/")) {
      return {
        loc: path,
        changefreq: "weekly",
        priority: 0.9,
        lastmod: new Date().toISOString(),
      };
    }

    if (["/about-us", "/contact-us", "/product-listing"].includes(path)) {
      return {
        loc: path,
        changefreq: "monthly",
        priority: 0.8,
        lastmod: new Date().toISOString(),
      };
    }

    // Default transformation
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: new Date().toISOString(),
    };
  },
};
