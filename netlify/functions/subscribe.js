exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let email;
  try {
    ({ email } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body" }) };
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid email address" }) };
  }

  const API_KEY = process.env.MAILCHIMP_API_KEY;
  const LIST_ID = process.env.MAILCHIMP_LIST_ID;
  const DC = API_KEY.split("-").pop(); // e.g. "us14"

  const url = `https://${DC}.api.mailchimp.com/3.0/lists/${LIST_ID}/members`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `apikey ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email_address: email,
      status: "subscribed",
    }),
  });

  const data = await response.json();

  // 200 = new subscriber, 400 with "Member Exists" = already subscribed (treat as success)
  if (response.ok || data.title === "Member Exists") {
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  }

  console.error("Mailchimp error:", data);
  return {
    statusCode: 500,
    body: JSON.stringify({ error: data.detail || "Subscription failed" }),
  };
};
