import { getStore } from "@netlify/blobs";
import { getUser } from "@netlify/identity";

export default async (req, context) => {
  try {
    const store = getStore({ name: "sannicola-adozioni", consistency: "strong" });
    const data = (await store.get("all", { type: "json" })) || [];

    let requester = null;
    try { requester = await getUser(); } catch (e) {}

    const visible = data.map(({ authorEmail, ...rest }) => ({
      ...rest,
      isMine: !!(requester && authorEmail && authorEmail === requester.email)
    }));

    return new Response(JSON.stringify(visible), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
