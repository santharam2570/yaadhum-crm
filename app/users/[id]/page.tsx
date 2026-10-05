import type { Metadata } from "next";
import { UserDetail } from "../UserDetail";

export const metadata: Metadata = { title: "User details" };

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <UserDetail id={id} />;
}
