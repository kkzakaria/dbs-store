import { createAccessControl } from "better-auth/plugins/access";

export const statement = {
  product: ["create", "read", "update", "delete"],
  order: ["read", "update", "delete"],
  member: ["create", "read", "update", "delete"],
} as const;

export const ac = createAccessControl(statement);

export const owner = ac.newRole({
  product: ["create", "read", "update", "delete"],
  order: ["read", "update", "delete"],
  member: ["create", "read", "update", "delete"],
});

export const admin = ac.newRole({
  product: ["create", "read", "update", "delete"],
  order: ["read", "update"],
  member: ["read"],
});

export const member = ac.newRole({
  product: ["read"],
  order: ["read"],
  member: ["read"],
});
