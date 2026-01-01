import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
}

export default function Button({ children, variant = 'primary', className = '', ...props }: ButtonProps) {

  const baseStyle = "px-6 py-3 font-bold border-2 border-black transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none";

  const variants = {
    primary: "bg-main text-black shadow-neo hover:bg-orange-400", // Orange
    secondary: "bg-white text-black shadow-neo hover:bg-gray-100", // White
    outline: "bg-transparent text-black border-black hover:bg-black hover:text-white" // Transparent
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}