import Navbar from "../components/public/Navbar";

function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#F7F8F3] text-[#17251B]">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}

export default PublicLayout;
