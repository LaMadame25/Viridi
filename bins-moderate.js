import { getStore } from "@netlify/blobs";
import { getUser } from "@netlify/identity";

export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Metodo non permesso" }), { status: 405 });
  }

  const user = await getUser();
  const roles = (user && user.roles) || [];
  if (!user || !roles.includes("admin")) {
    return new Response(JSON.stringify({ error: "Non autorizzato" }), { status: 403 });
  }

  try {
    const { id, action } = await req.json();
    if (!id || !["approve", "reject", "delete"].includes(action)) {
      return new Response(JSON.stringify({ error: "Richiesta non valida" }), { status: 400 });
    }

    const store = getStore({ name: "sannicola-cestini", consistency: "strong" });
    let data = (await store.get("all", { type: "json" })) || [];

    if (action === "delete") {
      data = data.filter((b) => b.id !== id);
    } else {
      const bin = data.find((b) => b.id === id);
      if (!bin) {
        return new Response(JSON.stringify({ error: "Cestino non trovato" }), { status: 404 });
      }
      bin.stato = action === "approve" ? "Approvato" : "Rifiutato";
    }

    await store.setJSON("all", data);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
