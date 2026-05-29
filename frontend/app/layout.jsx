import "../styles/globals/base.css";

export const metadata = {
  title: "Virtual Impact",
  description: "Elite digital growth systems.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
