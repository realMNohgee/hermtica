import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "x402 — True Agent Freedom | Hermtica",
  description:
    "x402 is the internet-native payment protocol that lets AI agents pay for tools directly over HTTP. No accounts, no Stripe, no human in the loop. This is how agents do business.",
};

export default function X402Page() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16 space-y-16">
      {/* Hero */}
      <section className="space-y-4">
        <p className="text-sm font-mono text-hermtica/70 uppercase tracking-widest">
          True Agent Freedom
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          The internet finally has its payment layer.
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
          Since 1996, HTTP status code 402 — &ldquo;Payment Required&rdquo; — has
          been sitting in the spec, reserved for future use. Everyone forgot
          about it.{" "}
          <strong className="text-foreground">
            x402 turned it on.
          </strong>
        </p>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { value: "75M+", label: "Transactions (30 days)" },
          { value: "$24M", label: "Volume (30 days)" },
          { value: "94K", label: "Buyers" },
          { value: "22K", label: "Sellers" },
        ].map((s) => (
          <div
            key={s.label}
            className="border border-border rounded-xl p-4 text-center"
          >
            <p className="text-2xl font-bold text-hermtica">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </section>

      {/* What is x402 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">What is x402?</h2>
        <p className="text-muted-foreground leading-relaxed">
          x402 is an open standard (Apache 2.0, Linux Foundation) that enables
          internet-native payments using stablecoins over standard HTTP. Backed
          by Coinbase and used by Fastly, Apify, and Agent Swarm, it&apos;s the
          first protocol that lets machines pay machines without a human filling
          out a checkout form.
        </p>
      </section>

      {/* How it works */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">How it works</h2>
        <div className="space-y-3">
          {[
            {
              step: "1",
              title: "Agent requests a tool",
              body: "An AI agent sends a normal HTTP request to a Hermtica API endpoint.",
            },
            {
              step: "2",
              title: "Server responds: 402",
              body: "If payment is required, the server responds with HTTP 402 and a PAYMENT-REQUIRED header containing the price, network, and token details.",
            },
            {
              step: "3",
              title: "Agent authorizes payment",
              body: "The agent signs a USDC payment using EIP-3009 (no gas fees for the sender) and retries the request with proof of payment.",
            },
            {
              step: "4",
              title: "Facilitator settles on-chain",
              body: "A facilitator verifies the payment, settles it on the blockchain, and confirms to the server.",
            },
            {
              step: "5",
              title: "Access granted",
              body: "Server returns 200 with the tool data. The entire flow happened inside HTTP — no accounts, no redirects, no human.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="flex gap-4 p-4 border border-border rounded-xl"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-hermtica/10 text-hermtica flex items-center justify-center font-bold text-sm">
                {item.step}
              </div>
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Old way vs x402 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">
          The old way vs. the x402 way
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="border border-red-500/20 bg-red-500/5 rounded-xl p-5 space-y-2">
            <h3 className="font-semibold text-red-400">The old way</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Create an account</li>
              <li>Enter credit card details</li>
              <li>Pass KYC verification</li>
              <li>Pre-load credits (overpay or run out)</li>
              <li>Store and rotate API keys</li>
              <li>AI agents can&apos;t do any of this</li>
            </ul>
          </div>
          <div className="border border-green-500/20 bg-green-500/5 rounded-xl p-5 space-y-2">
            <h3 className="font-semibold text-green-400">With x402</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>No accounts</li>
              <li>No credit cards</li>
              <li>No KYC</li>
              <li>Pay per use — exact amount, no waste</li>
              <li>No API keys to manage</li>
              <li>AI agents do it automatically</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Why Hermtica */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Why Hermtica is adopting x402</h2>
        <p className="text-muted-foreground leading-relaxed">
          Hermtica is a marketplace for AI agent tools. The vision is agents
          discovering, buying, and selling tools from each other — without
          humans in the loop. But until now, the payment layer didn&apos;t
          exist. Stripe works for humans. Credits work for simulated economies.
          Neither works for real agent-to-agent commerce.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          x402 changes that. It&apos;s the first payment protocol built for
          machines, not people. Agents can pay for API access the same way they
          request data — over HTTP. That&apos;s the foundation for everything
          we&apos;re building.
        </p>
      </section>

      {/* Dual rails */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Two payment doors</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="border border-border rounded-xl p-5 space-y-2">
            <h3 className="font-semibold">For humans</h3>
            <p className="text-sm text-muted-foreground">
              Stripe checkout. Credit card. One-time purchase. Download the
              tool. Same as always.
            </p>
          </div>
          <div className="border border-hermtica/30 bg-hermtica/5 rounded-xl p-5 space-y-2">
            <h3 className="font-semibold text-hermtica">For agents</h3>
            <p className="text-sm text-muted-foreground">
              x402 payments. USDC on Base. Pay-per-call. No human needed. The
              future of agent commerce.
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Same marketplace. Same tools. Two ways to pay. We&apos;re not
          replacing Stripe — we&apos;re adding the door agents actually need.
        </p>
      </section>

      {/* Business models */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Flexible pricing for tool authors</h2>
        <p className="text-muted-foreground leading-relaxed">
          x402 doesn&apos;t dictate your business model. Tool authors choose how
          to charge:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { title: "One-time", desc: "Pay once, lifetime access" },
            { title: "Monthly", desc: "Subscribe, cancel anytime" },
            { title: "Pay-per-call", desc: "Charge per API request" },
            { title: "Freemium", desc: "Free up to a limit, then pay" },
            { title: "Credit packs", desc: "Buy 1,000 calls in bulk" },
            { title: "Tiered", desc: "Different prices per feature" },
          ].map((m) => (
            <div
              key={m.title}
              className="border border-border rounded-lg p-3 text-center"
            >
              <p className="font-semibold text-sm">{m.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border border-hermtica/30 bg-hermtica/5 rounded-2xl p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold">
          True agent freedom starts here.
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          x402 is the missing payment layer of the internet. Hermtica is the
          marketplace where agents use it. Together, they&apos;re how AI agents
          finally do business on their own terms.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <a
            href="https://docs.x402.org"
            className="inline-flex items-center gap-1.5 rounded-full bg-muted text-foreground px-5 py-2 text-sm font-medium hover:bg-accent transition-colors"
          >
            x402 Docs →
          </a>
          <a
            href="/marketplace"
            className="inline-flex items-center gap-1.5 rounded-full bg-hermtica text-white px-5 py-2 text-sm font-medium hover:bg-hermtica/90 transition-colors"
          >
            Browse Tools
          </a>
        </div>
      </section>

      {/* Footer note */}
      <p className="text-xs text-muted-foreground text-center">
        x402 is an open standard under the Apache 2.0 license. Hermtica is not
        affiliated with the x402 Foundation or Coinbase. We just think
        it&apos;s the future.
      </p>
    </main>
  );
}
