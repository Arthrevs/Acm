import React from "react";

export function TactileToggle({
  checked = true,
  onChange,
  className = "",
  id = "tactile-toggle",
  name = "tactile-toggle",
}) {
  return (
    <label
      htmlFor={id}
      className={`cursor-pointer relative inline-flex h-[2.2em] w-[4.6em] items-center rounded-full bg-[hsl(0,0%,7%)] shadow-[0px_2px_4px_0px_rgb(18,18,18,0.35),0px_4px_8px_0px_rgb(18,18,18,0.5)] select-none text-[14px] ${className}`}
    >
      <span className="absolute inset-[0.1em] rounded-full border-[1px] border-[hsl(0,0%,25%)] pointer-events-none" />
      
      {/* Off indicator (Left circle) */}
      <div className="absolute left-[0.45em] top-1/2 flex h-[1.4em] w-[1.4em] -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-[inset_0px_2px_2px_0px_hsl(0,0%,85%)] pointer-events-none">
        <div className="h-[1em] w-[1em] rounded-full bg-[hsl(0,0%,7%)] shadow-[0px_2px_2px_0px_hsl(0,0%,85%)]" />
      </div>

      {/* On indicator (Right crimson bar) */}
      <div className="absolute right-[0.45em] top-1/2 h-[0.2em] w-[1.1em] -translate-y-1/2 rounded-full bg-[#ff4d4f] shadow-[inset_0px_2px_1px_0px_#b91c1c,0_0_6px_rgba(255,77,79,0.6)] pointer-events-none" />

      {/* Checkbox input */}
      <input
        id={id}
        name={name}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="peer absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10 m-0"
      />

      {/* Sliding tactile knob */}
      <span className="absolute left-[0.2em] top-1/2 flex h-[1.8em] w-[1.8em] -translate-y-1/2 items-center justify-center rounded-full bg-[rgb(26,26,26)] shadow-[inset_3px_3px_3px_0px_rgba(64,64,64,0.3),inset_-3px_-3px_3px_0px_rgba(16,16,16,0.6),0_2px_6px_rgba(0,0,0,0.5)] duration-300 peer-checked:left-[calc(100%-2em)] peer-checked:bg-[#1e1e24] peer-checked:shadow-[inset_3px_3px_3px_0px_rgba(255,77,79,0.25),inset_-3px_-3px_3px_0px_rgba(16,16,16,0.8),0_0_12px_rgba(255,77,79,0.4)] pointer-events-none">
        <span className="relative h-full w-full rounded-full">
          <span className="absolute inset-[0.08em] rounded-full border-[1px] border-[hsl(0,0%,50%)] peer-checked:border-[#ff4d4f]" />
        </span>
      </span>
    </label>
  );
}
