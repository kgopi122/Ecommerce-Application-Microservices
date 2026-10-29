import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, currency = "USD"): string {
  if (currency === "VND") {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function extractList<T>(data: unknown): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as T[];
  const obj = data as { data?: { content?: T[] } | T[] };
  if (Array.isArray(obj?.data)) return obj.data as T[];
  if (Array.isArray((obj?.data as { content?: T[] })?.content)) {
    return (obj?.data as { content?: T[] }).content as T[];
  }
  return [];
}

export const DEFAULT_PRODUCT_FALLBACK_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' fill='none'%3E%3Crect width='400' height='400' fill='%23F3F4F6'/%3E%3Cpath d='M140 160L200 120L260 160V240L200 280L140 240V160Z' stroke='%239CA3AF' stroke-width='12' stroke-linejoin='round'/%3E%3Cpath d='M200 120V200M260 160L200 200M140 160L200 200' stroke='%239CA3AF' stroke-width='12' stroke-linejoin='round'/%3E%3Ctext x='200' y='330' font-family='sans-serif' font-size='16' font-weight='600' fill='%236B7280' text-anchor='middle'%3EEzBuy Product%3C/text%3E%3C/svg%3E";

const CURATED_TECH_IMAGES: Record<string, string> = {
  iphone: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&auto=format&fit=crop&q=80",
  galaxy: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&auto=format&fit=crop&q=80",
  samsung: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&auto=format&fit=crop&q=80",
  macbook: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80",
  laptop: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&auto=format&fit=crop&q=80",
  phone: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80",
  audio: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
  headphone: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
  earbud: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80",
  watch: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
  tablet: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80",
  ipad: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80",
  monitor: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80",
  screen: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80",
  keyboard: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80",
  charger: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80",
  camera: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80",
  tv: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&auto=format&fit=crop&q=80",
  vacuum: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=600&auto=format&fit=crop&q=80",
  appliance: "https://images.unsplash.com/photo-1558002038-1055907df827?w=600&auto=format&fit=crop&q=80",
};

export function resolveProductImageUrl(url?: string, title?: string, categoryTitle?: string): string {
  // If URL points to internal docker service, map to gateway URL
  if (url && (url.includes("media-service:8083") || url.includes(":8083"))) {
    return url.replace(/http:\/\/media-service:8083/g, "http://localhost:9080/media")
              .replace(/http:\/\/localhost:8083/g, "http://localhost:9080/media");
  }

  // If valid external image (like unsplash or real http), keep it unless it's img.local or dummy
  if (url && !url.includes("img.local") && (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/"))) {
    return url;
  }

  // Derive by keyword matching on url, title, or category
  const target = `${url || ""} ${title || ""} ${categoryTitle || ""}`.toLowerCase();
  for (const [key, curatedUrl] of Object.entries(CURATED_TECH_IMAGES)) {
    if (target.includes(key)) {
      return curatedUrl;
    }
  }

  return CURATED_TECH_IMAGES.phone;
}
