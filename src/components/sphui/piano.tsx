import React, { useState, useEffect, useRef } from 'react';

interface PianoKey {
  midi: number;
  whiteIndex?: number;
  whiteIndexBefore?: number;
  label?: string;
}

const PianoKeyboard: React.FC = () => {
  const firstNote = 21; // A0
  const lastNote = 108; // C8

  const [pressedKeys, setPressedKeys] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerHeight = 150;

  const whiteKeyColor = "#FFFFFF";
  const whiteKeyPressedColor = "#E0E0E0";
  const blackKeyColor = "#202020";
  const blackKeyPressedColor = "#404040";
  const borderColor = "#D0D0D0";
  const blackKeyBorderColor = "#303030";

  const isBlackKey = (midiNote: number): boolean => {
    const noteInOctave = midiNote % 12;
    return [1, 3, 6, 8, 10].includes(noteInOctave);
  };

  // Calculate note name for labels
  const getNoteLabel = (midi: number): string | undefined => {
    const noteInOctave = midi % 12;
    const octave = Math.floor(midi / 12) - 1;
    if (noteInOctave === 0) return `C${octave}`;
    return undefined;
  };

  // Compute keys with positioning information
  const whiteKeys: PianoKey[] = [];
  const blackKeys: PianoKey[] = [];
  let whiteIndex = 0;
  
  for (let midi = firstNote; midi <= lastNote; midi++) {
    if (!isBlackKey(midi)) {
      whiteKeys.push({
        midi,
        whiteIndex,
        label: getNoteLabel(midi)
      });
      whiteIndex++;
    } else {
      blackKeys.push({
        midi,
        whiteIndexBefore: whiteIndex - 1
      });
    }
  }

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const numWhiteKeys = whiteKeys.length;
  const whiteKeyWidth = containerWidth / numWhiteKeys;
  const blackKeyWidth = whiteKeyWidth * 0.6;
  const blackKeyHeight = containerHeight * 0.65;

  const handleMouseDown = (midi: number) => {
    setPressedKeys(prev => [...prev, midi]);
  };

  const handleMouseUp = (midi: number) => {
    setPressedKeys(prev => prev.filter(key => key !== midi));
  };

  // Calculate black key position
  const getBlackKeyPosition = (midi: number): number => {
    const whiteKeyBeforeIndex = blackKeys.find(bk => bk.midi === midi)?.whiteIndexBefore;
    if (whiteKeyBeforeIndex === undefined) return 0;
  
    return (whiteKeyBeforeIndex + 1) * whiteKeyWidth - (blackKeyWidth / 2);
  };
  

  return (
    <div
      ref={containerRef}
      className="relative select-none"
      style={{ height: containerHeight }}
    >
      {/* White Keys */}
      <div className="flex h-full">
        {whiteKeys.map((key) => (
          <div
            key={key.midi}
            className="relative border-l border-r-0 border-t border-b last:border-r"
            style={{
              flexBasis: `${100 / numWhiteKeys}%`,
              backgroundColor: pressedKeys.includes(key.midi)
                ? whiteKeyPressedColor
                : whiteKeyColor,
              borderColor: borderColor,
            }}
          >
            {key.label && (
              <div className="absolute bottom-2 w-full text-center text-xs font-sans text-gray-400">
                {key.label}
              </div>
            )}
            <div
              className="absolute inset-0"
              onMouseDown={(e) => {
                e.preventDefault();
                handleMouseDown(key.midi);
              }}
              onMouseUp={() => handleMouseUp(key.midi)}
              onMouseLeave={() => handleMouseUp(key.midi)}
            />
          </div>
        ))}
      </div>

      {/* Black Keys */}
      {containerWidth > 0 &&
        blackKeys.map((key) => (
          <div
            key={key.midi}
            className="absolute z-10"
            style={{
              left: getBlackKeyPosition(key.midi),
              width: blackKeyWidth,
              height: blackKeyHeight,
              backgroundColor: pressedKeys.includes(key.midi)
                ? blackKeyPressedColor
                : blackKeyColor,
              border: `1px solid ${blackKeyBorderColor}`,
              borderRadius: '0 0 4px 4px',
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              handleMouseDown(key.midi);
            }}
            onMouseUp={() => handleMouseUp(key.midi)}
            onMouseLeave={() => handleMouseUp(key.midi)}
          >
            <div
              className="absolute inset-0"
              style={{ backgroundColor: "#FFFFFF", opacity: 0.05 }}
            />
          </div>
        ))}
    </div>
  );
};

export default PianoKeyboard;