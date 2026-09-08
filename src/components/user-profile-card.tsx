import type { AppUser } from "@/src/types/user";

type UserProfileCardProps = {
    user: AppUser;
};

export function UserProfileCard({ user }: UserProfileCardProps) {
    return (
        <article className="rounded-2xl border border-zinc-200 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900">{user.name}</h2>
            <p className="mt-1 text-sm text-zinc-600">{user.email}</p>
        </article>
    );
}
