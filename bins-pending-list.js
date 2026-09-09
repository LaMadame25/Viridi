import { getStore } from "@netlify/blobs";
import { getUser } from "@netlify/identity";

export default async (req, context) => {
  const user = await getUser();
  const roles = (user && user.roles) || [];
  if (!user || !roles.includes("admin")) {
    return new Response(JSON.stringify({ error: "Non autorizzato" }), { status: 403 });
  }

  try {
    const store = getStore({ name: "sannicola-cestini", consistency: "strong" });
    const data = (await store.get("all", { type: "json" })) || [];
    const pending = data
      .filter((b) => b.stato === "In attesa")
      .map(({ authorEmail, ...rest }) => rest);

    return new Response(JSON.stringify(pending), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
