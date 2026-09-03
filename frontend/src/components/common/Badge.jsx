function Badge({
  children,
  variant = "default",
}) {
  const variants = {
    default:
      "bg-[#EEF2EE] text-[#445148]",

    success:
      "bg-[#E7F4EC] text-[#176B45]",

    warning:
      "bg-[#FFF4D6] text-[#8A5A00]",

    danger:
      "bg-[#FDECEC] text-[#B42318]",

    info:
      "bg-[#EAF2F8] text-[#245B7A]",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${variants[variant]}`}
    >
      {children}
    </span>
  );
}

export default Badge;