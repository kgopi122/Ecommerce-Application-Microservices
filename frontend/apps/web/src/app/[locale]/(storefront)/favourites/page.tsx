"use client";

import React from "react";
import Link from "next/link";
import { Heart, ShoppingCart, ArrowLeft } from "lucide-react";
import { Button, EmptyState } from "@ecommerce/ui";

export default function FavouritesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
            <Heart className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Favourites</h1>
            <p className="text-sm text-gray-500">Items you have saved to your wishlist</p>
          </div>
        </div>

        <EmptyState
          icon={<Heart className="h-20 w-20 text-pink-200" />}
          title="Your wishlist is empty"
          description="Browse our collection of electronics, phones, and laptops to save your favourite products."
          action={
            <Link href="/products">
              <Button size="lg" className="gap-2">
                <ShoppingCart className="h-4 w-4" /> Discover Products
              </Button>
            </Link>
          }
        />

        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
