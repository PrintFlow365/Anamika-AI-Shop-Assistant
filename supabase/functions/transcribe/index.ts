Deno.serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const contentType = req.headers.get("content-type") || "";

    let audioBlob: Blob;
    let language = "bn";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const audioFile = formData.get("audio");
      const langParam = formData.get("language");
      if (langParam) language = String(langParam);
      if (!audioFile || !(audioFile instanceof Blob)) {
        return new Response(
          JSON.stringify({ error: "No audio file provided in 'audio' field" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      audioBlob = audioFile;
    } else {
      audioBlob = await req.blob();
      if (audioBlob.size === 0) {
        return new Response(
          JSON.stringify({ error: "Empty audio data" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    if (audioBlob.size > 25 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: "Audio file too large (max 25MB)" }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "Speech-to-text service not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const audioType = audioBlob.type || "audio/webm";
    const ext = audioType.includes("webm") ? "webm"
      : audioType.includes("ogg") ? "ogg"
      : audioType.includes("mp4") ? "mp4"
      : audioType.includes("mpeg") ? "mp3"
      : audioType.includes("wav") ? "wav"
      : "webm";

    const whisperFormData = new FormData();
    whisperFormData.append("file", audioBlob, `recording.${ext}`);
    whisperFormData.append("model", "whisper-1");
    whisperFormData.append("language", language);

    const whisperResponse = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: whisperFormData,
      },
    );

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();
      console.error("Whisper API error:", whisperResponse.status, errorText);
      return new Response(
        JSON.stringify({
          error: "Transcription service error",
          detail: `Whisper API returned ${whisperResponse.status}`,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const whisperData = await whisperResponse.json();
    const transcript = whisperData.text || "";

    if (!transcript.trim()) {
      return new Response(
        JSON.stringify({ transcript: "", error: "No speech detected" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ transcript }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Transcription error:", err);
    return new Response(
      JSON.stringify({ error: "Transcription failed", detail: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
