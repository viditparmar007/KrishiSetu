function Alert({
  children,
  variant = "info",
}) {
  const variants = {
    success: {
      container: "border-[#B7DEC6] bg-[#EAF7EF] text-[#176B45]",
      icon: "✓",
    },

    warning: {
      container: "border-[#F0D89A] bg-[#FFF8E5] text-[#8A5A00]",
      icon: "!",
    },

    error: {
      container: "border-[#F0C2C2] bg-[#FDECEC] text-[#B42318]",
      icon: "×",
    },

    info: {
      container: "border-[#BDD4E5] bg-[#EDF6FB] text-[#245B7A]",
      icon: "i",
    },
  };

  const style = variants[variant];

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${style.container}`}
      role="alert"
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-bold">
        {style.icon}
      </span>

      <p>{children}</p>
    </div>
  );
}

export default Alert;