"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  changeOwnPassword,
  createUser,
  deleteUser,
  resetUserPassword,
  updateUserRole,
  type ActionResult,
} from "./actions";
import type { UserRole } from "@/lib/auth/session";

export interface AppUserRow {
  id: string;
  username: string;
  role: UserRole;
  created_at: string;
}

export default function UsersManager({ users, currentUserId }: { users: AppUserRow[]; currentUserId: string }) {
  return (
    <div className="mt-6 space-y-8">
      <CreateUserCard />
      <UserList users={users} currentUserId={currentUserId} />
      <ChangeOwnPasswordCard />
    </div>
  );
}

function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-white/10 dark:bg-neutral-900">
      <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-neutral-500">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Notice({ result }: { result: ActionResult | null }) {
  if (!result) return null;
  return result.ok ? (
    <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
      Saved.
    </p>
  ) : (
    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
      {result.error}
    </p>
  );
}

function CreateUserCard() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("agent");
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const res = await createUser(username, password, role);
      setResult(res);
      if (res.ok) {
        setUsername("");
        setPassword("");
        setRole("agent");
        router.refresh();
      }
    });
  }

  return (
    <Card title="Add a user" description="They sign in at /login with these details.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Username</span>
            <input
              type="text"
              required
              autoComplete="off"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Password (min 8)
            </span>
            <input
              type="text"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Role</span>
            <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="input">
              <option value="agent">Agent — reports only</option>
              <option value="admin">Admin — reports + records</option>
            </select>
          </label>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm
            transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create user"}
        </button>

        <Notice result={result} />
      </form>
    </Card>
  );
}

function UserList({ users, currentUserId }: { users: AppUserRow[]; currentUserId: string }) {
  return (
    <Card title="Existing users">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-white/10">
              <th className="px-3 py-2 text-left font-medium text-neutral-600 dark:text-neutral-400">Username</th>
              <th className="px-3 py-2 text-left font-medium text-neutral-600 dark:text-neutral-400">Role</th>
              <th className="px-3 py-2 text-left font-medium text-neutral-600 dark:text-neutral-400">Added</th>
              <th className="px-3 py-2 text-right font-medium text-neutral-600 dark:text-neutral-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <UserRowItem key={u.id} user={u} isSelf={u.id === currentUserId} />
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-sm text-neutral-500">
                  No accounts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function UserRowItem({ user, isSelf }: { user: AppUserRow; isSelf: boolean }) {
  const [result, setResult] = useState<ActionResult | null>(null);
  const [resetting, setResetting] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function run(fn: () => Promise<ActionResult>, onSuccess?: () => void) {
    setResult(null);
    startTransition(async () => {
      const res = await fn();
      setResult(res);
      if (res.ok) onSuccess?.();
      // Refresh on failure too: the role <select> has already moved to the
      // value the user picked, so a rejected change (last-admin guard) would
      // otherwise leave the dropdown disagreeing with the database.
      router.refresh();
    });
  }

  return (
    <>
      <tr className="border-b border-neutral-100 last:border-0 dark:border-white/5">
        <td className="px-3 py-3 text-neutral-800 dark:text-neutral-200">
          {user.username}
          {isSelf && <span className="ml-2 text-xs text-neutral-400">(you)</span>}
        </td>
        <td className="px-3 py-3">
          <select
            value={user.role}
            disabled={pending}
            onChange={(e) => run(() => updateUserRole(user.id, e.target.value as UserRole))}
            className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          >
            <option value="agent">Agent</option>
            <option value="admin">Admin</option>
          </select>
        </td>
        <td className="px-3 py-3 text-neutral-500">
          {new Date(user.created_at).toLocaleDateString("en-GB", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </td>
        <td className="px-3 py-3">
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => setResetting((v) => !v)}
              className="text-sm font-medium text-neutral-700 transition hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
            >
              {resetting ? "Cancel" : "Reset password"}
            </button>
            {!isSelf && (
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (!window.confirm(`Delete "${user.username}"? They lose access immediately.`)) return;
                  run(() => deleteUser(user.id));
                }}
                className="text-sm font-medium text-red-600 transition hover:text-red-700 disabled:opacity-50 dark:text-red-400"
              >
                Delete
              </button>
            )}
          </div>
        </td>
      </tr>

      {(resetting || result) && (
        <tr className="border-b border-neutral-100 last:border-0 dark:border-white/5">
          <td colSpan={4} className="px-3 pb-3">
            {resetting && (
              <div className="flex flex-wrap items-end gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    New password for {user.username} (min 8)
                  </span>
                  <input
                    type="text"
                    value={newPassword}
                    minLength={8}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input"
                  />
                </label>
                <button
                  type="button"
                  disabled={pending || newPassword.length < 8}
                  onClick={() =>
                    run(() => resetUserPassword(user.id, newPassword), () => {
                      setNewPassword("");
                      setResetting(false);
                    })
                  }
                  className="rounded-lg bg-neutral-900 px-3 py-2 text-sm font-semibold text-white transition
                    hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50
                    dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                >
                  {pending ? "Saving…" : "Set password"}
                </button>
              </div>
            )}
            <div className="mt-2">
              <Notice result={result} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function ChangeOwnPasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const res = await changeOwnPassword(currentPassword, newPassword);
      setResult(res);
      if (res.ok) {
        setCurrentPassword("");
        setNewPassword("");
      }
    });
  }

  return (
    <Card title="Change my password" description="You stay signed in on this device after changing it.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Current password
            </span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              New password (min 8)
            </span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm
            transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Saving…" : "Change password"}
        </button>

        <Notice result={result} />
      </form>
    </Card>
  );
}
