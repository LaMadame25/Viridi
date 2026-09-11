import { getStore } from "@netlify/blobs";
import { getUser } from "@netlify/identity";

export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Metodo non permesso" }), { status: 405 });
  }

  const user = await getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Devi accedere" }), { status: 401 });
  }

  try {
    const { id } = await req.json();
    if (!id) {
      return new Response(JSON.stringify({ error: "Parametro mancante" }), { status: 400 });
    }

    const roles = user.roles || [];
    const isAdmin = roles.includes("admin");

    const store = getStore({ name: "sannicola-adozioni", consistency: "strong" });
    let data = (await store.get("all", { type: "json" })) || [];

    const adoption = data.find(a => a.id === id);
    if (!adoption) {
      return new Response(JSON.stringify({ error: "Adozione non trovata" }), { status: 404 });
    }
    if (adoption.authorEmail !== user.email && !isAdmin) {
      return new Response(JSON.stringify({ error: "Non autorizzato" }), { status: 403 });
    }

    data = data.filter(a => a.id !== id);
    await store.setJSON("all", data);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
