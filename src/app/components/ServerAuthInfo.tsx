import { getAuthSession } from "@/lib/auth";

export default async function ServerAuthInfo() {
  const session = await getAuthSession();

  if (!session) {
    return (
      <div className="p-4 bg-blue-100 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Server-side Auth Status</h3>
        <p>No active session</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Server-side Auth Status</h3>
      <div className="mb-4">
        <p className="font-medium">User: {session.user?.name}</p>
        <p className="text-sm text-gray-600">Email: {session.user?.email}</p>
      </div>
      <details>
        <summary className="cursor-pointer text-sm font-medium">
          Full Session Data
        </summary>
        <pre className="mt-2 text-xs bg-white p-2 rounded overflow-auto">
          {JSON.stringify(session, null, 2)}
        </pre>
      </details>
    </div>
  );
}
