import { NextRequest } from "next/server";

interface ActiveAdmin {
  uid: string;
  email: string;
  role: "ceo" | "agent";
}

export async function getActiveAdmin(request: NextRequest): Promise<ActiveAdmin | null> {
  const idToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!idToken || !firebaseApiKey || !projectId) return null;

  const authResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
    cache: "no-store",
  });
  if (!authResponse.ok) return null;
  const authData = await authResponse.json();
  const firebaseUser = authData.users?.[0];
  if (!firebaseUser?.localId) return null;

  const profileResponse = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/usuarios/${encodeURIComponent(firebaseUser.localId)}`, {
    headers: { Authorization: `Bearer ${idToken}` },
    cache: "no-store",
  });
  if (!profileResponse.ok) return null;
  const profile = await profileResponse.json();
  const active = profile.fields?.active?.booleanValue === true;
  const role = profile.fields?.role?.stringValue;
  if (!active || !["ceo", "agent"].includes(role)) return null;
  return { uid: firebaseUser.localId, email: firebaseUser.email || "", role } as ActiveAdmin;
}
