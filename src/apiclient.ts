// src/apiclient.ts
async function test() {
  const res = await fetch("http://localhost:3000/api/journey", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      legs: [
        { mode: "air", origin: "Lowell Field", destination: "Grass Patch Airport" }
      ]
    })
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

test().catch(console.error);