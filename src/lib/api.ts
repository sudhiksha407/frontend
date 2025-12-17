export async function analyzeCTI(text: string) {
  const res = await fetch(
    "https://sudhiksha2302-techrag-backend.hf.space/api/predict",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: [text], // Gradio expects array
      }),
    }
  );

  if (!res.ok) {
    throw new Error("Backend request failed");
  }

  const json = await res.json();

  // Gradio returns { data: [...] }
  return json.data[0];
}
