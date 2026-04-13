import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import BackToTop from "./BackToTop";
import AdSlot from "./AdSlot";
import CookieConsent from "./CookieConsent";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      {/* Top banner ad */}
      <div className="container py-2 hidden md:block">
        <AdSlot slotId="header-banner" format="leaderboard" />
      </div>
      <div className="container py-2 md:hidden">
        <AdSlot slotId="header-mobile" format="mobile" />
      </div>
      <main className="flex-1" id="main-content">{children}</main>
      <Footer />
      <BackToTop />
    </div>
  );
};

export default Layout;
