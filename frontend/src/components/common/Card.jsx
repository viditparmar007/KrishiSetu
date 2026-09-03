function Card({
  children,
  className = "",
  padding = "p-6",
}) {
  return (
    <div
      className={`rounded-2xl border border-[#DCE5D7] bg-white ${padding} shadow-sm transition-shadow duration-200 hover:shadow-md ${className}`}
    >
      {children}
    </div>
  );
}

export default Card;