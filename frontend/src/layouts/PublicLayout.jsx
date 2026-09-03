function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#F7F8F3] text-[#17251B]">
      <div className="min-h-screen">
        <main>{children}</main>
      </div>
    </div>
  );
}

export default PublicLayout;
