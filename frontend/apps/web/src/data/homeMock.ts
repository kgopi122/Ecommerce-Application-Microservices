// Mock data for the storefront homepage showcasing the full CellphoneS-style UI.

export interface ShowcaseProduct {
  productId: number;
  productTitle: string;
  imageUrl?: string;
  priceUnit: number;
  oldPrice?: number;
  discountPercent?: number;
  rating?: number;
  sold?: number;
  stockTotal?: number; // for flash-sale progress bar
  memberExtra?: number; // member discount amount
  installment?: boolean;
  badge?: string;
  category?: { categoryId: number; categoryTitle: string };
}

export interface SidebarCategory {
  id: number;
  emoji: string;
  label: string;
  href: string;
}

export interface BrandChip {
  id: number;
  label: string;
  href: string;
}

export interface HeroSlide {
  id: number;
  key: string; // -> Home.{key}Title / Home.{key}Sub
  href: string;
  gradient: string;
}

export interface CategoryIcon {
  id: number;
  key: string; // -> Category.{key}
  emoji: string;
  href: string;
}

export interface BrandLogo {
  id: number;
  name: string;
  href: string;
}

export const heroSlides: HeroSlide[] = [
  { id: 1, key: "slide1", href: "/products?categoryId=1", gradient: "from-rose-600 via-primary-600 to-primary-700" },
  { id: 2, key: "slide2", href: "/products?categoryId=2", gradient: "from-indigo-600 via-blue-600 to-sky-600" },
  { id: 3, key: "slide3", href: "/products?categoryId=3", gradient: "from-emerald-600 via-teal-600 to-cyan-600" },
];

export const heroSideBanners = [
  { id: 1, key: "side1", gradient: "from-amber-500 to-orange-600", href: "/products" },
  { id: 2, key: "side2", gradient: "from-purple-600 to-fuchsia-600", href: "/products" },
];

export const quickDeals = [
  { id: 1, key: "deal1", emoji: "⚡", href: "/products?sort=priceUnit,asc" },
  { id: 2, key: "deal2", emoji: "🎓", href: "/products" },
  { id: 3, key: "deal3", emoji: "♻️", href: "/products" },
  { id: 4, key: "deal4", emoji: "🆕", href: "/products?sort=productId,desc" },
  { id: 5, key: "deal5", emoji: "🎟️", href: "/products" },
];

export const categoryIcons: CategoryIcon[] = [
  { id: 1, key: "c1", emoji: "📱", href: "/products?categoryId=1" },
  { id: 2, key: "c2", emoji: "💻", href: "/products?categoryId=2" },
  { id: 3, key: "c3", emoji: "📲", href: "/products?categoryId=3" },
  { id: 4, key: "c4", emoji: "🎧", href: "/products?categoryId=4" },
  { id: 5, key: "c5", emoji: "⌚", href: "/products?categoryId=5" },
  { id: 6, key: "c6", emoji: "📷", href: "/products?categoryId=6" },
  { id: 7, key: "c7", emoji: "🏠", href: "/products?categoryId=7" },
  { id: 8, key: "c8", emoji: "🖥️", href: "/products?categoryId=8" },
  { id: 9, key: "c9", emoji: "🔌", href: "/products?categoryId=9" },
  { id: 10, key: "c10", emoji: "📺", href: "/products?categoryId=10" },
];

export const brands: BrandLogo[] = [
  { id: 1, name: "Apple", href: "/products?brand=apple" },
  { id: 2, name: "Samsung", href: "/products?brand=samsung" },
  { id: 3, name: "Xiaomi", href: "/products?brand=xiaomi" },
  { id: 4, name: "OPPO", href: "/products?brand=oppo" },
  { id: 5, name: "ASUS", href: "/products?brand=asus" },
  { id: 6, name: "Dell", href: "/products?brand=dell" },
  { id: 7, name: "Sony", href: "/products?brand=sony" },
  { id: 8, name: "Lenovo", href: "/products?brand=lenovo" },
];

export const flashSaleProducts: ShowcaseProduct[] = [
  { productId: 101, productTitle: "Galaxy A55 5G Smartphone 8GB/256GB", imageUrl: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&auto=format&fit=crop&q=80", priceUnit: 349, oldPrice: 449, discountPercent: 22, rating: 5, sold: 120, stockTotal: 150, installment: true, category: { categoryId: 1, categoryTitle: "Phones" } },
  { productId: 102, productTitle: "Pro 2 Noise-Cancelling Bluetooth Earbuds", imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80", priceUnit: 179, oldPrice: 249, discountPercent: 28, rating: 5, sold: 340, stockTotal: 400, installment: false, category: { categoryId: 4, categoryTitle: "Audio" } },
  { productId: 103, productTitle: "UltraBook 14-inch Laptop i5/16GB/512GB", imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&auto=format&fit=crop&q=80", priceUnit: 699, oldPrice: 849, discountPercent: 18, rating: 4, sold: 56, stockTotal: 100, installment: true, category: { categoryId: 2, categoryTitle: "Laptops" } },
  { productId: 104, productTitle: "Watch Active 3 Smartwatch (GPS + Heart Rate)", imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80", priceUnit: 129, oldPrice: 189, discountPercent: 32, rating: 5, sold: 210, stockTotal: 250, installment: false, category: { categoryId: 5, categoryTitle: "Watches" } },
  { productId: 105, productTitle: "Galaxy Tab S9 11-inch Tablet 128GB Wi-Fi", imageUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80", priceUnit: 499, oldPrice: 629, discountPercent: 21, rating: 4, sold: 88, stockTotal: 120, installment: true, category: { categoryId: 3, categoryTitle: "Tablets" } },
  { productId: 106, productTitle: "Fast Charging Power Bank 20,000mAh PD 22.5W", imageUrl: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80", priceUnit: 29, oldPrice: 49, discountPercent: 41, rating: 5, sold: 530, stockTotal: 600, installment: false, category: { categoryId: 9, categoryTitle: "Accessories" } },
];

export const hotProducts: ShowcaseProduct[] = [
  { productId: 201, productTitle: "Galaxy S24 Ultra 5G AI Phone 12GB/256GB", imageUrl: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&auto=format&fit=crop&q=80", priceUnit: 1199, oldPrice: 1399, discountPercent: 14, rating: 5, sold: 412, installment: true, badge: "0% APR", category: { categoryId: 1, categoryTitle: "Phones" } },
  { productId: 202, productTitle: "Redmi Note 13 Pro 8GB/256GB Smartphone", imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80", priceUnit: 269, oldPrice: 319, discountPercent: 16, rating: 5, sold: 980, installment: true, category: { categoryId: 1, categoryTitle: "Phones" } },
  { productId: 203, productTitle: "Gaming Laptop RTX 4060 i7/16GB/1TB SSD", imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80", priceUnit: 1249, oldPrice: 1499, discountPercent: 17, rating: 5, sold: 134, installment: true, category: { categoryId: 2, categoryTitle: "Laptops" } },
  { productId: 204, productTitle: "RGB 7.1 Surround Sound Gaming Headset", imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80", priceUnit: 49, oldPrice: 69, discountPercent: 29, rating: 4, sold: 760, installment: false, category: { categoryId: 4, categoryTitle: "Audio" } },
  { productId: 205, productTitle: "OPPO Reno11 F 5G Smartphone 8GB/256GB", imageUrl: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&auto=format&fit=crop&q=80", priceUnit: 349, oldPrice: 419, discountPercent: 17, rating: 5, sold: 256, installment: true, category: { categoryId: 1, categoryTitle: "Phones" } },
  { productId: 206, productTitle: "Wireless Mechanical Keyboard Hot-Swappable", imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80", priceUnit: 59, oldPrice: 89, discountPercent: 34, rating: 5, sold: 420, installment: false, category: { categoryId: 9, categoryTitle: "Accessories" } },
  { productId: 207, productTitle: "27-inch 2K 165Hz IPS Gaming Monitor", imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80", priceUnit: 219, oldPrice: 289, discountPercent: 24, rating: 5, sold: 188, installment: true, category: { categoryId: 8, categoryTitle: "Monitors" } },
  { productId: 208, productTitle: "Smart Robot Vacuum & Mop with LiDAR Mapping", imageUrl: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=600&auto=format&fit=crop&q=80", priceUnit: 299, oldPrice: 429, discountPercent: 30, rating: 4, sold: 145, installment: true, category: { categoryId: 7, categoryTitle: "Smart Home" } },
  { productId: 209, productTitle: "65W GaN Fast Wall Charger 3-Port Type-C", imageUrl: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80", priceUnit: 22, oldPrice: 35, discountPercent: 37, rating: 5, sold: 1120, installment: false, category: { categoryId: 9, categoryTitle: "Accessories" } },
  { productId: 210, productTitle: "55-inch 4K Ultra HD Smart Google TV HDR", imageUrl: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&auto=format&fit=crop&q=80", priceUnit: 429, oldPrice: 599, discountPercent: 28, rating: 5, sold: 99, installment: true, category: { categoryId: 10, categoryTitle: "TVs" } },
];

// Left vertical category list shown in the hero sidebar.
export const heroSidebar: SidebarCategory[] = [
  { id: 1, emoji: "📱", label: "Smartphones & Tablets", href: "/products?categoryId=1" },
  { id: 2, emoji: "💻", label: "Laptops & Computers", href: "/products?categoryId=2" },
  { id: 3, emoji: "🎧", label: "Audio & Microphones", href: "/products?categoryId=4" },
  { id: 4, emoji: "⌚", label: "Smartwatches & Wearables", href: "/products?categoryId=5" },
  { id: 5, emoji: "🏠", label: "Smart Home & Appliances", href: "/products?categoryId=7" },
  { id: 6, emoji: "🔌", label: "Accessories & Chargers", href: "/products?categoryId=9" },
  { id: 7, emoji: "🖥️", label: "PC, Monitors & Printers", href: "/products?categoryId=8" },
  { id: 8, emoji: "📺", label: "TV & Smart Displays", href: "/products?categoryId=10" },
  { id: 9, emoji: "🎮", label: "Gaming Gear & Cooling", href: "/products?categoryId=9" },
  { id: 10, emoji: "♻️", label: "Refurbished & Deals", href: "/products" },
];

// Brand filter chips per category section.
export const phoneBrands: BrandChip[] = [
  { id: 1, label: "Apple", href: "/products?brand=apple" },
  { id: 2, label: "Samsung", href: "/products?brand=samsung" },
  { id: 3, label: "Xiaomi", href: "/products?brand=xiaomi" },
  { id: 4, label: "OPPO", href: "/products?brand=oppo" },
  { id: 5, label: "realme", href: "/products?brand=realme" },
  { id: 6, label: "Nokia", href: "/products?brand=nokia" },
  { id: 7, label: "Sony", href: "/products?brand=sony" },
  { id: 8, label: "Honor", href: "/products?brand=honor" },
];

export const laptopBrands: BrandChip[] = [
  { id: 1, label: "MacBook", href: "/products?brand=macbook" },
  { id: 2, label: "ASUS", href: "/products?brand=asus" },
  { id: 3, label: "Lenovo", href: "/products?brand=lenovo" },
  { id: 4, label: "Acer", href: "/products?brand=acer" },
  { id: 5, label: "HP", href: "/products?brand=hp" },
  { id: 6, label: "Dell", href: "/products?brand=dell" },
  { id: 7, label: "MSI", href: "/products?brand=msi" },
  { id: 8, label: "Gigabyte", href: "/products?brand=gigabyte" },
];

export const phoneProducts: ShowcaseProduct[] = [
  { productId: 301, productTitle: "Galaxy A57 5G 8GB/256GB Smartphone", imageUrl: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&auto=format&fit=crop&q=80", priceUnit: 369, oldPrice: 429, discountPercent: 14, rating: 5, sold: 320, memberExtra: 15, installment: true, category: { categoryId: 1, categoryTitle: "Phones" } },
  { productId: 302, productTitle: "Galaxy S24 Flagship 8GB/256GB", imageUrl: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&auto=format&fit=crop&q=80", priceUnit: 799, oldPrice: 899, discountPercent: 11, rating: 5, sold: 210, memberExtra: 25, installment: true, category: { categoryId: 1, categoryTitle: "Phones" } },
  { productId: 303, productTitle: "OPPO Reno13 F 5G Ultra Slim", imageUrl: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&auto=format&fit=crop&q=80", priceUnit: 389, oldPrice: 449, discountPercent: 13, rating: 4, sold: 156, memberExtra: 10, installment: true, category: { categoryId: 1, categoryTitle: "Phones" } },
  { productId: 304, productTitle: "Xiaomi Redmi Note 14 5G 8GB/256GB", imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80", priceUnit: 229, oldPrice: 269, discountPercent: 15, rating: 5, sold: 540, memberExtra: 10, installment: true, category: { categoryId: 1, categoryTitle: "Phones" } },
  { productId: 305, productTitle: "realme C75 6GB/128GB Long-Battery Phone", imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80", priceUnit: 189, oldPrice: 229, discountPercent: 17, rating: 4, sold: 280, installment: true, category: { categoryId: 1, categoryTitle: "Phones" } },
];

export const laptopProducts: ShowcaseProduct[] = [
  { productId: 401, productTitle: "MacBook Air M3 13-inch 16GB/256GB", imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80", priceUnit: 1099, oldPrice: 1199, discountPercent: 8, rating: 5, sold: 132, memberExtra: 30, installment: true, category: { categoryId: 2, categoryTitle: "Laptops" } },
  { productId: 402, productTitle: "ASUS Vivobook 15 FHD i5/16GB/512GB", imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&auto=format&fit=crop&q=80", priceUnit: 649, oldPrice: 779, discountPercent: 17, rating: 5, sold: 240, memberExtra: 20, installment: true, category: { categoryId: 2, categoryTitle: "Laptops" } },
  { productId: 403, productTitle: "Lenovo LOQ Gaming Laptop RTX 4060 i7/16GB", imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80", priceUnit: 1129, oldPrice: 1299, discountPercent: 13, rating: 5, sold: 98, memberExtra: 35, installment: true, category: { categoryId: 2, categoryTitle: "Laptops" } },
  { productId: 404, productTitle: "Acer Aspire 5 Slim i5/8GB/512GB SSD", imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&auto=format&fit=crop&q=80", priceUnit: 549, oldPrice: 649, discountPercent: 15, rating: 4, sold: 310, installment: true, category: { categoryId: 2, categoryTitle: "Laptops" } },
  { productId: 405, productTitle: "HP Pavilion 14 Touchscreen i7/16GB/1TB", imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&auto=format&fit=crop&q=80", priceUnit: 829, oldPrice: 949, discountPercent: 13, rating: 5, sold: 76, memberExtra: 25, installment: true, category: { categoryId: 2, categoryTitle: "Laptops" } },
];

export function nextFlashSaleDeadline(): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(now.getHours() + 1, 0, 0, 0);
  return next.getTime();
}
