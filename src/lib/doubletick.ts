const DOUBLETICK_URL =
  "https://public.doubletick.io/whatsapp/message/template";

export const REFERRAL_TEMPLATE_NAME = "nippon_referral_invite_v1";

export class DoubleTickError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "DoubleTickError";
  }
}

export function isTransientError(error: unknown): boolean {
  return (
    (error instanceof DoubleTickError &&
      (error.status === 429 || (error.status !== undefined && error.status >= 500))) ||
    error instanceof TypeError ||
    (error instanceof Error && error.name === "TimeoutError")
  );
}

export async function sendReferralInvite(
  phone: string,
  name: string,
  url: string,
): Promise<void> {
  const apiKey = process.env.DOUBLETICK_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new DoubleTickError("DOUBLETICK_API_KEY is not configured");
    }
    console.info("[DoubleTick mock]", { phone, template: REFERRAL_TEMPLATE_NAME });
    return;
  }

  const from = process.env.DOUBLETICK_FROM;
  if (!from) throw new DoubleTickError("DOUBLETICK_FROM is not configured");

  const response = await fetch(DOUBLETICK_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [
        {
          to: phone,
          from,
          content: {
            templateName: REFERRAL_TEMPLATE_NAME,
            language: "en",
            templateData: { body: { placeholders: [name, url] } },
          },
        },
      ],
    }),
    signal: AbortSignal.timeout(10_000),
  });

  const text = await response.text().catch(() => "");
  if (!response.ok) {
    throw new DoubleTickError(
      `DoubleTick API ${response.status}: ${text.slice(0, 300)}`,
      response.status,
    );
  }

  let data: { messages?: Array<{ status?: string; errorMessage?: string }> };
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new DoubleTickError("DoubleTick returned invalid JSON");
  }
  const message = data.messages?.[0];
  if (message?.status === "FAILED" || message?.errorMessage) {
    throw new DoubleTickError(
      message.errorMessage ?? "DoubleTick returned FAILED",
    );
  }
}
