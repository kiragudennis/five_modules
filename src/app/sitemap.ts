import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://www.blessedtwo.com",
      lastModified: "2025-10-01",
      changeFrequency: "weekly",
      priority: 1,
      images: [`https://www.blessedtwo.com/images/wsf-cover.jpg`],
    },
    {
      url: "https://www.blessedtwo.com/products",
      lastModified: "2021-01-01",
      changeFrequency: "monthly",
      priority: 0.9,
      images: ["https://www.blessedtwo.com/images/products.jpg"],
    },
    {
      url: "https://www.blessedtwo.com/login",
      lastModified: "2021-01-01",
      changeFrequency: "weekly",
      priority: 0.8,
      images: ["https://www.blessedtwo.com/images/login.jpg"],
    },
    {
      url: "https://www.blessedtwo.com/about",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
      images: ["https://www.blessedtwo.com/images/about.jpg"],
    },
    {
      url: "https://www.blessedtwo.com/categories",
      lastModified: "2021-01-01",
      changeFrequency: "monthly",
      priority: 0.6,
      images: ["https://www.blessedtwo.com/images/categories.jpg"],
    },
    {
      url: "https://www.blessedtwo.com/contact",
      lastModified: "2021-01-01",
      changeFrequency: "monthly",
      priority: 0.5,
      images: ["https://www.blessedtwo.com/images/contact.jpg"],
    },
    {
      url: "https://www.blessedtwo.com/shipping",
      lastModified: "2021-01-01",
      changeFrequency: "monthly",
      priority: 0.4,
      images: ["https://www.blessedtwo.com/images/shipping.jpg"],
    },
    {
      url: "https://www.blessedtwo.com/privacy",
      lastModified: "2021-01-01",
      changeFrequency: "monthly",
      priority: 0.3,
      images: ["https://www.blessedtwo.com/images/privacy.jpg"],
    },
    {
      url: "https://www.blessedtwo.com/terms",
      lastModified: "2021-01-01",
      changeFrequency: "monthly",
      priority: 0.2,
      images: ["https://www.blessedtwo.com/images/terms.jpg"],
    },
  ];
}
