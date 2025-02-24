import React, { useRef, useEffect, useState, useCallback } from 'react';

interface KnobProps {
  id: string;
  size?: number;
  min?: number;
  max?: number;
  value?: number;
  unit?: 'h' | 'm' | 's' | 'ms' | 'percent' | 'number' | 'value' | 'dB';  // Added 'dB'
  isInteger?: boolean;
  colors?: [string, string, string, string]; // [background, track, knob, indicator]
  sensitivity?: number;
  onChange?: (value: number) => void;
  smoothing?: boolean;
  rampTime?: number; // add this
}

const Knob: React.FC<KnobProps> = ({
  size = 60,
  min = 0,
  max = 1,
  value = 0,
  unit = 'number',
  isInteger = false,
  colors = ['transparent', '#333333', '#666666', '#FFCC00'],
  sensitivity = 0.005,
  smoothing = true,
  onChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({
    startY: 0,
    startValue: 0
  });

  const [displayValue, setDisplayValue] = useState(value);
  const valueRef = useRef(value);
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Smooth value changes
  useEffect(() => {
    if (!smoothing) {
      setDisplayValue(value);
      return;
    }

    const animate = () => {
      const diff = value - valueRef.current;
      if (Math.abs(diff) < 0.001) {
        setDisplayValue(value);
        valueRef.current = value;
        animationFrameRef.current = undefined;
        return;
      }

      const newValue = valueRef.current + diff * 0.3;
      setDisplayValue(newValue);
      valueRef.current = newValue;
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [value, smoothing]);

  // Clean up animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Use displayValue for rendering instead of direct value
  const normalizedValue = (displayValue - min) / (max - min);

  const startAngle = 0.75 * Math.PI;
  const endAngle = 2.25 * Math.PI;
  const angleRange = endAngle - startAngle;

  const formatValue = useCallback((val: number): string => {
    const formatted = isInteger ? Math.round(val) : Number(val.toFixed(2));
    switch (unit) {
      case 'h': return `${formatted}h`;
      case 'm': return `${formatted}m`;
      case 's': return `${formatted}s`;
      case 'ms': return `${formatted}ms`;
      case 'percent': return `${formatted}%`;
      case 'value': return `${formatted}v`;
      case 'dB': 
        if (formatted <= -60) return '-∞dB';
        return `${formatted}dB`;
      default: return `${formatted}`;
    }
  }, [isInteger, unit]);

  const clamp = (value: number, min: number, max: number): number => 
    Math.min(Math.max(value, min), max);

  const handleValueChange = useCallback((newValue: number) => {
    const clampedValue = clamp(newValue, min, max);
    onChange?.(clampedValue);
  }, [min, max, onChange]);

  const handleDrag = useCallback((e: MouseEvent | React.MouseEvent | Touch) => {
    if (!isDragging) return;

    const deltaY = (e instanceof Touch ? e.clientY : e.clientY) - dragRef.current.startY;
    const valueDelta = deltaY * sensitivity * (max - min);
    const newValue = dragRef.current.startValue - valueDelta;
    handleValueChange(newValue);
  }, [isDragging, sensitivity, min, max, handleValueChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = {
      startY: e.clientY,
      startValue: value
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = {
      startY: e.touches[0].clientY,
      startValue: value
    };
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    const handleMouseMove = (e: MouseEvent) => handleDrag(e);
    const handleTouchMove = (e: TouchEvent) => handleDrag(e.touches[0]);
    const handleTouchEnd = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleDrag]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const padding = 2;
    
    // Setup canvas for HiDPI displays
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Calculate dimensions
    const center = size / 2;
    const radius = (size - padding * 2) / 2;
    const indicatorRadius = radius - 4;
    const knobRadius = radius * 0.7;

    // Draw track
    ctx.beginPath();
    ctx.arc(center, center, radius, startAngle, endAngle);
    ctx.strokeStyle = colors[1];
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Draw value indicator
    const valueAngle = startAngle + (normalizedValue * angleRange);
    ctx.beginPath();
    ctx.arc(center, center, indicatorRadius, startAngle, valueAngle);
    ctx.strokeStyle = colors[3];
    ctx.stroke();

    // Draw knob
    ctx.beginPath();
    ctx.arc(center, center, knobRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = colors[2];
    ctx.stroke();

    // Draw indicator line
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.lineTo(
      center + Math.cos(valueAngle) * (knobRadius - 2),
      center + Math.sin(valueAngle) * (knobRadius - 2)
    );
    ctx.strokeStyle = colors[3];
    ctx.lineWidth = 2;
    ctx.stroke();

  }, [size, colors, normalizedValue, startAngle, endAngle]);

  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        className="cursor-pointer touch-none select-none"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      />
      <div className="text-center mt-2 font-medium text-sm">
        {formatValue(displayValue)}
      </div>
    </div>
  );
};

export default Knob;