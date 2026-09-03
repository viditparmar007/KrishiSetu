function Input({
  label,
  type = "text",
  name,
  value,
  onChange,
  placeholder = "",
  error = "",
  required = false,
  disabled = false,
}) {
  return (
    <div className="w-full">
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-semibold text-[#243329]"
      >
        {label}

        {required && (
          <span className="ml-1 text-[#B42318]">*</span>
        )}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-[#17251B] outline-none transition placeholder:text-[#9AA39C] disabled:cursor-not-allowed disabled:bg-[#F2F4F1] ${
          error
            ? "border-[#B42318] focus:ring-2 focus:ring-[#B42318]/20"
            : "border-[#C9D5CC] focus:border-[#1F6B45] focus:ring-2 focus:ring-[#1F6B45]/20"
        }`}
      />

      {error && (
        <p className="mt-2 text-sm text-[#B42318]">
          {error}
        </p>
      )}
    </div>
  );
}

export default Input;