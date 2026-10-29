import React from "react";
import Link from "next/link";
import { CreditCard, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Installment & Payment Plans | Ecommerce",
  description: "Flexible 0% interest installment plans available through supported payment providers.",
};

export default function InstallmentPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Installment & Payment Plans</h1>
            <p className="text-sm text-gray-500">Flexible 0% interest installment plans available through supported payment providers.</p>
          </div>
        </div>

        <hr className="my-6 border-gray-100" />

        <div className="prose max-w-none text-gray-600 space-y-4">
          <p>
            Welcome to the <strong>Installment & Payment Plans</strong> page. We provide transparent and reliable services
            for all our valued customers.
          </p>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <h2 className="font-semibold text-gray-800 text-sm mb-1">Details & Policy</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Flexible 0% interest installment plans available through supported payment providers. If you need immediate assistance or have specific inquiries, please contact our
              support hotline at <span className="font-semibold text-primary-600">1800 2064</span> or visit our Help Center.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Explore Catalog
          </Link>
        </div>
      </div>
    </div>
  );
}
