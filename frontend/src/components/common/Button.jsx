function Button({
  children,
  variant = "primary",
  type = "button",
  disabled = false,
  onClick,
  className = "",
}) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1F6B45] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  const variants = {
    primary:
      "bg-[#1F6B45] text-white shadow-sm hover:bg-[#185638] hover:-translate-y-0.5",

    secondary:
      "border border-[#C9D5CC] bg-white text-[#243329] hover:bg-[#F2F5F0]",

    ghost:
      "bg-transparent text-[#1F6B45] hover:bg-[#E8F3EB]",

    danger:
      "bg-[#B42318] text-white hover:bg-[#912018]",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export default Button;