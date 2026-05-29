import Image from "next/image";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Join Us", href: "/join-us" },
  { label: "Agent Portal", href: "/agent-portal/login", isButton: true },
];

export default function MainNav() {
  return (
    <header className="vi-nav">
      <div className="vi-container vi-nav-shell">
        <a href="/" className="vi-nav-brand" aria-label="Virtual Impact home">
          <Image
            src="/icons/VLOGO-Photoroom.png"
            alt="Virtual Impact V logo"
            width={36}
            height={36}
            priority
          />
          <strong className="vi-gold-text" style={{ letterSpacing: "0.08em" }}>
            VIRTUAL IMPACT
          </strong>
        </a>
        <nav className="vi-nav-links">
          {navItems.map((item) => (
            <a
              key={item.label}
              className={item.isButton ? "vi-nav-cta" : "vi-cyan-text"}
              href={item.href}
              aria-label={item.label}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
