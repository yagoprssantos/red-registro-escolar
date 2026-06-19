import type { RegistryUser } from "@/lib/registry-types";

type UserLike = {
  id: number;
  openId?: string | null;
  name: string | null;
  email: string | null;
  loginMethod?: string | null;
  role?: string | null;
  defaultProfile?: string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  lastSignedIn?: Date | string | null;
};

function toIso(value?: Date | string | null): string | null {
  if (value == null) return null;
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}

export function toRegistryUser(user: UserLike): RegistryUser {
  return {
    id: user.id,
    openId: user.openId ?? null,
    name: user.name,
    email: user.email,
    loginMethod: user.loginMethod ?? null,
    role: user.role ?? null,
    defaultProfile: user.defaultProfile ?? null,
    createdAt: toIso(user.createdAt),
    updatedAt: toIso(user.updatedAt),
    lastSignedIn: toIso(user.lastSignedIn),
  };
}
