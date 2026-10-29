"use client";

import { Link } from "@/i18n/navigation";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ShoppingBag, Package, Users, TrendingUp, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import { orderApi, productApi } from "@ecommerce/lib/api";
import { formatPrice, extractList } from "@ecommerce/lib/utils";
import type { ApiResponse, PaginatedResponse, Order, Product } from "@ecommerce/lib/types";
import { dashboardStyles as s } from "./dashboard.styles";

export default function DashboardPage() {
  const t = useTranslations("Dashboard");

  const { data: ordersData } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const res = await orderApi.getAll({ page: 0, size: 10 });
      return res.data as ApiResponse<PaginatedResponse<Order>>;
    },
  });

  const { data: productsData } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const res = await productApi.getAll({ page: 0, size: 10 });
      return res.data as ApiResponse<PaginatedResponse<Product>>;
    },
  });

  const orders = extractList<Order>(ordersData);
  const products = extractList<Product>(productsData);
  const totalOrders = Array.isArray(ordersData) ? ordersData.length : (ordersData?.data?.totalElements ?? orders.length);
  const totalProducts = Array.isArray(productsData) ? productsData.length : (productsData?.data?.totalElements ?? products.length);
  const revenue = orders.reduce((sum, o) => sum + (o.orderFee ?? 0), 0);

  const stats = [
    { label: t("revenue"),  value: formatPrice(revenue),              icon: TrendingUp, color: "bg-green-100 text-green-600",  change: "+12.5%", up: true },
    { label: t("orders"),   value: totalOrders.toLocaleString(),      icon: ShoppingBag, color: "bg-blue-100 text-blue-600",   change: "+8.2%",  up: true },
    { label: t("products"), value: totalProducts.toLocaleString(),    icon: Package,    color: "bg-orange-100 text-orange-600",change: "+3.1%",  up: true },
    { label: t("users"),    value: "\u2014",                           icon: Users,      color: "bg-purple-100 text-purple-600",change: "-2.4%",  up: false },
  ];

  return (
    <div className={s.root}>
      <div>
        <h1 className={s.title}>{t("title")}</h1>
        <p className={s.subtitle}>{t("subtitle")}</p>
      </div>

      <StatsGrid stats={stats} />

      <div className={s.panelsGrid}>
        <RecentOrdersPanel orders={orders} />
        <RecentProductsPanel products={products} />
      </div>
    </div>
  );
}

function StatsGrid({ stats }: { stats: Array<{ label: string; value: string; icon: React.ElementType; color: string; change: string; up: boolean }> }) {
  return (
    <div className={s.statsGrid}>
      {stats.map(({ label, value, icon: Icon, color, change, up }) => (
        <div key={label} className={s.statCard}>
          <div className={s.statHead}>
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
              <Icon className="h-5 w-5" />
            </div>
            <span className={`flex items-center gap-1 text-xs font-medium ${up ? "text-green-500" : "text-red-500"}`}>
              {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {change}
            </span>
          </div>
          <p className={s.statValue}>{value}</p>
          <p className={s.statLabel}>{label}</p>
        </div>
      ))}
    </div>
  );
}

function RecentOrdersPanel({ orders }: { orders: Order[] }) {
  const t = useTranslations("Dashboard");
  const tSidebar = useTranslations("Sidebar");
  return (
    <div className={s.panel}>
      <div className={s.panelHead}>
        <h2 className={s.panelTitle}>{t("recentOrders")}</h2>
        <Link href="/admin/orders" className={s.panelLink}>{tSidebar("orders")} &rarr;</Link>
      </div>
      {orders.length === 0 ? (
        <div className={s.panelEmpty}>{t("noOrders")}</div>
      ) : (
        <div className={s.panelList}>
          {orders.slice(0, 5).map((order) => (
            <div key={order.orderId} className={s.row}>
              <div className={s.orderIcon}>
                <ShoppingBag className="h-4 w-4 text-blue-600" />
              </div>
              <div className={s.rowInfo}>
                <p className={s.rowTitle}>{t("order", { id: order.orderId })}</p>
                <p className={s.rowMeta}>
                  <Clock className="h-3 w-3" />
                  {order.orderDate ? new Date(order.orderDate).toLocaleDateString("vi-VN") : "\u2014"}
                </p>
              </div>
              <p className={s.rowPrice}>{formatPrice(order.orderFee ?? 0)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RecentProductsPanel({ products }: { products: Product[] }) {
  const t = useTranslations("Dashboard");
  const tSidebar = useTranslations("Sidebar");
  return (
    <div className={s.panel}>
      <div className={s.panelHead}>
        <h2 className={s.panelTitle}>{t("recentProducts")}</h2>
        <Link href="/admin/products" className={s.panelLink}>{tSidebar("products")} &rarr;</Link>
      </div>
      {products.length === 0 ? (
        <div className={s.panelEmpty}>{t("noProducts")}</div>
      ) : (
        <div className={s.panelList}>
          {products.slice(0, 5).map((product) => (
            <div key={product.productId} className={s.row}>
              <div className={s.productIcon}>
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.imageUrl} alt={product.productTitle} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <Package className="h-5 w-5 text-primary-300" />
                )}
              </div>
              <div className={s.rowInfo}>
                <p className={s.rowTitle}>{product.productTitle}</p>
                <p className="text-xs text-gray-500">{product.category?.categoryTitle ?? t("uncategorized")}</p>
              </div>
              <div className="text-right">
                <p className={s.rowPrice}>{formatPrice(product.priceUnit)}</p>
                <p className={`text-xs ${product.quantity > 0 ? "text-green-600" : "text-red-500"}`}>
                  {product.quantity > 0 ? t("inStock", { count: product.quantity }) : t("outOfStock")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
