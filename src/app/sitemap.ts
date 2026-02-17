import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://www.blessedtwoelectronics.com",
      lastModified: "2025-10-01",
      changeFrequency: "weekly",
      priority: 1,
      images: [`https://www.blessedtwoelectronics.com/images/wsf-cover.jpg`],
    },
    {
      url: "https://www.blessedtwoelectronics.com/products",
      lastModified: "2021-01-01",
      changeFrequency: "monthly",
      priority: 0.9,
      images: ["https://www.blessedtwoelectronics.com/images/products.jpg"],
    },
    {
      url: "https://www.blessedtwoelectronics.com/login",
      lastModified: "2021-01-01",
      changeFrequency: "weekly",
      priority: 0.8,
      images: ["https://www.blessedtwoelectronics.com/images/login.jpg"],
    },
    {
      url: "https://www.blessedtwoelectronics.com/about",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
      images: ["https://www.blessedtwoelectronics.com/images/about.jpg"],
    },
    {
      url: "https://www.blessedtwoelectronics.com/categories",
      lastModified: "2021-01-01",
      changeFrequency: "monthly",
      priority: 0.6,
      images: ["https://www.blessedtwoelectronics.com/images/categories.jpg"],
    },
    {
      url: "https://www.blessedtwoelectronics.com/contact",
      lastModified: "2021-01-01",
      changeFrequency: "monthly",
      priority: 0.5,
      images: ["https://www.blessedtwoelectronics.com/images/contact.jpg"],
    },
    {
      url: "https://www.blessedtwoelectronics.com/shipping",
      lastModified: "2021-01-01",
      changeFrequency: "monthly",
      priority: 0.4,
      images: ["https://www.blessedtwoelectronics.com/images/shipping.jpg"],
    },
    {
      url: "https://www.blessedtwoelectronics.com/privacy",
      lastModified: "2021-01-01",
      changeFrequency: "monthly",
      priority: 0.3,
      images: ["https://www.blessedtwoelectronics.com/images/privacy.jpg"],
    },
    {
      url: "https://www.blessedtwoelectronics.com/terms",
      lastModified: "2021-01-01",
      changeFrequency: "monthly",
      priority: 0.2,
      images: ["https://www.blessedtwoelectronics.com/images/terms.jpg"],
    },
  ];
}
