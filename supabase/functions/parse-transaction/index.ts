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

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "AI parsing service not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    const transcript: string = (body.transcript || "").trim();
    const vocabulary: Array<{ term: string; meaning: string }> = body.vocabulary || [];
    const units: Array<{ unitName: string; piecesPerUnit: number; baseUnitName?: string }> = body.units || [];
    const existingCustomers: Array<{ id: string; name: string }> = body.customers || [];
    const existingSuppliers: Array<{ id: string; name: string }> = body.suppliers || [];

    if (!transcript) {
      return new Response(
        JSON.stringify({ error: "No transcript provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const vocabStr = vocabulary.length > 0
      ? vocabulary.map((v) => `"${v.term}" = "${v.meaning}"`).join(", ")
      : "none";

    const unitsStr = units.length > 0
      ? units.map((u) => `1 ${u.unitName} = ${u.piecesPerUnit} ${u.baseUnitName || "পিস"}`).join(", ")
      : "none";

    const customersStr = existingCustomers.length > 0
      ? existingCustomers.map((c) => `${c.name} (id: ${c.id})`).join(", ")
      : "none";

    const suppliersStr = existingSuppliers.length > 0
      ? existingSuppliers.map((s) => `${s.name} (id: ${s.id})`).join(", ")
      : "none";

    const systemPrompt = `তুমি একটি বাংলা দোকান হিসাবরক্ষক AI। দোকানের মালিক বাংলায় কথা বলেন এবং তুমি সেটি বিশ্লেষণ করে একটি কাঠামো তৈরি করবে।

তোমার কাজ: বাংলা বাক্য থেকে লেনদেনের ধরন, পরিমাণ, এবং সম্পর্কিত ব্যক্তি বের করা।

লেনদেনের ধরন (type):
- SALE: বিক্রি (মাল বিক্রি করলে)
- PURCHASE: ক্রয় (মাল কিনলে)
- CUSTOMER_PAYMENT: বকেয়া আদায় (কাস্টমার থেকে টাকা পেলে)
- SUPPLIER_PAYMENT: পাওনা পরিশোধ (সাপ্লায়ারকে টাকা দিলে)
- EXPENSE: খরচ (বিদ্যুৎ বিল, পরিবহন ইত্যাদি)
- OWNER_WITHDRAWAL: মালিক তোলা (বাড়িতে টাকা নিলে)
- LOAN_GIVEN: ধার দেওয়া
- LOAN_REPAID: ধার ফেরত
- DAMAGE_LOSS: ক্ষতি/নষ্ট

নিয়ম:
1. পরিমাণ (amount) সবসময় সংখ্যায় দিতে হবে (বাংলা সংখ্যা হলে ইংরেজি সংখ্যায় রূপান্তর করুন)
2. "হাজার" = 1000, "লাখ" = 100000 গুণ করুন (যেমন "২ হাজার" = 2000)
3. যদি কাস্টমার/সাপ্লায়ারের নাম existing লিস্টে থাকে, তার id ব্যবহার করুন
4. যদি নাম লিস্টে না থাকে, partyName দিন কিন্তু partyId খালি রাখুন
5. যদি বিক্রিতে আংশিক টাকা দেওয়া হয়, paidAmount এবং dueAmount দুটোই দিন
6. যদি বাক্যটি অস্পষ্ট বা একাধিক অর্থ বোঝায়, confident=false করুন

কাস্টম ভোকাবুলারি: ${vocabStr}
কাস্টম একক: ${unitsStr}
বিদ্যমান কাস্টমার: ${customersStr}
বিদ্যমান সাপ্লায়ার: ${suppliersStr}

JSON ফরম্যাটে উত্তর দিন:
{
  "type": "SALE|PURCHASE|CUSTOMER_PAYMENT|SUPPLIER_PAYMENT|EXPENSE|OWNER_WITHDRAWAL|LOAN_GIVEN|LOAN_REPAID|DAMAGE_LOSS",
  "amount": number,
  "paidAmount": number | null,
  "dueAmount": number | null,
  "partyId": string | null,
  "partyName": string | null,
  "isCustomer": boolean,
  "notes": string | null,
  "confident": boolean,
  "summary": string
}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: transcript },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI parsing service error" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(content);
    } catch {
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ parsed }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Parse transaction error:", err);
    return new Response(
      JSON.stringify({ error: "Parsing failed", detail: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
