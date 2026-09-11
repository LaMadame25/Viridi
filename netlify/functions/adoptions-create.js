import { getStore } from "@netlify/blobs";
import { getUser } from "@netlify/identity";

export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Metodo non permesso" }), { status: 405 });
  }

  const user = await getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Devi accedere per adottare un'area" }), { status: 401 });
  }

  try {
    const body = await req.json();
    const { lat, lng, comune, label, nota } = body;

    if (typeof lat !== "number" || typeof lng !== "number") {
      return new Response(JSON.stringify({ error: "Posizione mancante" }), { status: 400 });
    }

    const comuneValido = comune === "San Marco Evangelista" ? "San Marco Evangelista" : "San Nicola la Strada";
    const displayName = (user.userMetadata && user.userMetadata.full_name) || user.email.split("@")[0];

    const newAdoption = {
      id: "a" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      lat,
      lng,
      comune: comuneValido,
      label: (typeof label === "string" && label.trim()) ? label.trim().slice(0, 100) : "Area senza nome",
      nota: (typeof nota === "string" && nota.trim()) ? nota.trim().slice(0, 200) : null,
      adottante: displayName,
      authorEmail: user.email,
      createdAt: Date.now()
    };

    const store = getStore({ name: "sannicola-adozioni", consistency: "strong" });
    const data = (await store.get("all", { type: "json" })) || [];
    data.unshift(newAdoption);
    await store.setJSON("all", data);

    const { authorEmail, ...toReturn } = newAdoption;
    return new Response(JSON.stringify({ ...toReturn, isMine: true }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
