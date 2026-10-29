"use client";

import React, { useSyncExternalStore } from "react";
import Link from "next/link";
import { User, Mail, Shield, LogOut, ArrowLeft, Package } from "lucide-react";
import { useAuthStore } from "@ecommerce/lib/store";
import { Button } from "@ecommerce/ui";
import { buildSsoLoginUrl } from "@ecommerce/lib/api";

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export default function ProfilePage() {
  const isClient = useIsClient();
  const { user, isAuthenticated, logout } = useAuthStore();

  if (!isClient) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="animate-pulse bg-white rounded-2xl h-64 border border-gray-100" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">You are not logged in</h1>
          <p className="text-sm text-gray-500 mb-6">
            Please log in with Keycloak SSO to access your profile and order history.
          </p>
          <a
            href={buildSsoLoginUrl()}
            className="inline-flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Log in with Keycloak
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        <div className="flex items-center justify-between pb-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary-600 text-white font-bold text-xl flex items-center justify-center">
              {user.fullName ? user.fullName[0].toUpperCase() : user.username ? user.username[0].toUpperCase() : "U"}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{user.fullName || user.username}</h1>
              <p className="text-sm text-gray-500">@{user.username}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => logout()}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            <LogOut className="h-4 w-4 mr-1.5" /> Log out
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-6">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-100">
            <Mail className="h-5 w-5 text-gray-400 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Email Address</p>
              <p className="text-sm font-medium text-gray-800">{user.email || "Not specified"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-100">
            <Shield className="h-5 w-5 text-gray-400 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Assigned Roles</p>
              <p className="text-sm font-medium text-gray-800">
                {user.roles && user.roles.length > 0 ? user.roles.map((r) => r.name || r).join(", ") : "Customer (ROLE_USER)"}
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            <Package className="h-4 w-4" /> View My Orders
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" /> Return to Store
          </Link>
        </div>
      </div>
    </div>
  );
}
