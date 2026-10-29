"use client";

import { useState } from "react";
import { User, Mail, Lock, Phone, UserCheck, ShieldCheck, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button, Input } from "@ecommerce/ui";
import { authApi } from "@ecommerce/lib/api";
import { useRegister } from "@/hooks";
import { Link, useRouter } from "@/i18n/navigation";
import { authStyles as s } from "./auth.styles";

export default function RegisterForm() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const { register: handleSsoRegister } = useRegister();

  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    gender: "Male",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.fullName || !form.username || !form.email || !form.password || !form.gender) {
      setError(t("errRequired"));
      return;
    }

    if (form.fullName.trim().length < 6) {
      setError("Full name must be at least 6 characters");
      return;
    }

    if (form.username.trim().length < 6) {
      setError("Username must be at least 6 characters");
      return;
    }

    if (form.password.length < 8) {
      setError(t("errPasswordLen"));
      return;
    }

    // Allows letters, digits, and any standard symbols; requires at least 1 uppercase, 1 lowercase, 1 number, no spaces
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)\S{8,50}$/;
    if (!passwordRegex.test(form.password)) {
      setError("Password must contain at least one uppercase letter, one lowercase letter, and one number (no spaces). Symbols like @$!%*?&_#.- are allowed.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError(t("errPasswordMatch"));
      return;
    }

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    if (!emailRegex.test(form.email)) {
      setError(t("errEmail"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        fullName: form.fullName.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        gender: form.gender,
        phone: form.phone.trim() || undefined,
      };

      await authApi.signup(payload);
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2500);
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { message?: string; errors?: string[] } };
      };
      const apiErrors = axiosError.response?.data?.errors;
      const apiMessage = axiosError.response?.data?.message;

      if (apiErrors && apiErrors.length > 0) {
        setError(apiErrors.join(", "));
      } else if (apiMessage) {
        setError(apiMessage);
      } else {
        setError(t("errRegister"));
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={s.successWrap}>
        <div className={s.successIcon}>
          <UserCheck className="h-8 w-8 text-green-600" />
        </div>
        <h2 className={s.successTitle}>{t("successTitle")}</h2>
        <p className={s.successText}>{t("successRedirect")}</p>
      </div>
    );
  }

  return (
    <div className={s.form}>
      {error && <div className={s.errorBox}>{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <Input
          label={t("fullNameLabel")}
          name="fullName"
          placeholder={t("fullNamePlaceholder")}
          value={form.fullName}
          onChange={handleChange}
          leftIcon={<User className="h-4 w-4" />}
          required
        />

        <div className={s.grid2}>
          <Input
            label={t("usernameRegLabel")}
            name="username"
            placeholder={t("usernameRegPlaceholder")}
            value={form.username}
            onChange={handleChange}
            leftIcon={<User className="h-4 w-4" />}
            required
          />

          <div>
            <label className={s.fieldLabel}>{t("genderLabel")}</label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className={s.select}
            >
              <option value="Male">{t("genderMale")}</option>
              <option value="Female">{t("genderFemale")}</option>
              <option value="Other">{t("genderOther")}</option>
            </select>
          </div>
        </div>

        <div className={s.grid2}>
          <Input
            label={t("emailLabel")}
            name="email"
            type="email"
            placeholder={t("emailPlaceholder")}
            value={form.email}
            onChange={handleChange}
            leftIcon={<Mail className="h-4 w-4" />}
            required
          />

          <Input
            label={t("phoneLabel")}
            name="phone"
            placeholder={t("phonePlaceholder")}
            value={form.phone}
            onChange={handleChange}
            leftIcon={<Phone className="h-4 w-4" />}
          />
        </div>

        <div className={s.grid2}>
          <div>
            <Input
              label={t("passwordRegLabel")}
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="e.g. Secret123@"
              value={form.password}
              onChange={handleChange}
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="hover:text-gray-700 transition-colors pointer-events-auto"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              required
            />
          </div>

          <div>
            <Input
              label={t("confirmPasswordLabel")}
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder={t("confirmPasswordPlaceholder")}
              value={form.confirmPassword}
              onChange={handleChange}
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="hover:text-gray-700 transition-colors pointer-events-auto"
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              required
            />
          </div>
        </div>

        <p className="text-xs text-gray-500">
          Must be at least 8 characters with uppercase, lowercase, and numbers. Symbols (like @, #, $, !) are welcome.
        </p>

        <Button
          type="submit"
          className="w-full mt-2"
          size="lg"
          disabled={loading}
        >
          {loading ? "Creating account..." : t("registerBtn")}
          <ArrowRight className="h-4 w-4 ml-1.5" />
        </Button>
      </form>

      <div className={s.divider}>
        <span className={s.dividerLine} />
        <span className={s.dividerText}>or continue with</span>
        <span className={s.dividerLine} />
      </div>

      <Button
        variant="outline"
        onClick={handleSsoRegister}
        className={s.ssoBtn}
        size="md"
        type="button"
      >
        <ShieldCheck className="h-4 w-4 mr-1 text-primary-600" />
        {t("registerSsoBtn")}
      </Button>

      <p className={s.switchText}>
        {t("hasAccount")}{" "}
        <Link href="/login" className={s.switchLink}>
          {t("loginLink")}
        </Link>
      </p>
    </div>
  );
}
