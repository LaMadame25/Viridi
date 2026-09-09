import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  try {
    const store = getStore({ name: "sannicola-cestini", consistency: "strong" });
    const data = (await store.get("all", { type: "json" })) || [];
    const approved = data
      .filter((b) => b.stato === "Approvato")
      .map(({ authorEmail, ...rest }) => rest);

    return new Response(JSON.stringify(approved), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
