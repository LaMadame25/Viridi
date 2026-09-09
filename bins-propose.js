import { getStore } from "@netlify/blobs";
import { getUser } from "@netlify/identity";

const TIPI_VALIDI = [
  "Cestino stradale",
  "Isola ecologica",
  "Campana vetro",
  "Contenitore organico",
  "Altro punto di raccolta"
];

export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Metodo non permesso" }), { status: 405 });
  }

  const user = await getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Devi accedere per proporre un cestino" }), { status: 401 });
  }

  try {
    const body = await req.json();
    const { lat, lng, comune, tipo, note } = body;

    if (typeof lat !== "number" || typeof lng !== "number") {
      return new Response(JSON.stringify({ error: "Posizione mancante" }), { status: 400 });
    }

    const comuneValido = comune === "San Marco Evangelista" ? "San Marco Evangelista" : "San Nicola la Strada";
    const tipoValido = TIPI_VALIDI.includes(tipo) ? tipo : "Cestino stradale";
    const displayName = (user.userMetadata && user.userMetadata.full_name) || user.email.split("@")[0];

    const newBin = {
      id: "b" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      lat,
      lng,
      comune: comuneValido,
      tipo: tipoValido,
      note: (typeof note === "string" && note.trim()) ? note.trim().slice(0, 200) : null,
      stato: "In attesa", // visibile solo dopo l'approvazione di un amministratore
      proposedBy: displayName,
      authorEmail: user.email,
      createdAt: Date.now()
    };

    const store = getStore({ name: "sannicola-cestini", consistency: "strong" });
    const data = (await store.get("all", { type: "json" })) || [];
    data.unshift(newBin);
    await store.setJSON("all", data);

    const { authorEmail, ...toReturn } = newBin;
    return new Response(JSON.stringify(toReturn), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
