import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <label className="font-bold text-sm">{label}</label>}
      <input 
        className={`w-full p-3 border-2 border-black bg-white shadow-neo-sm focus:outline-none focus:shadow-neo transition-all ${className}`}
        {...props}
      />
    </div>
  );
}