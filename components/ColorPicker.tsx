import React from 'react';
import { DEFAULT_NOTEBOOK_COLORS } from '../constants';

interface ColorPickerProps {
  selectedColor: string;
  onSelectColor: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ selectedColor, onSelectColor }) => {
  return (
    <div className="grid grid-cols-6 gap-2">
      {DEFAULT_NOTEBOOK_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onSelectColor(color)}
          className={`w-10 h-10 rounded-full ${color} ring-2 ring-offset-2 dark:ring-offset-gray-800 transition-all
            ${selectedColor === color ? 'ring-blue-500 dark:ring-blue-400 scale-110' : 'ring-transparent hover:scale-105'}`}
          aria-label={`Vælg farve ${color.replace('bg-', '').replace('-500', '')}`}
        />
      ))}
    </div>
  );
};

export default ColorPicker;