import React, { useState, useRef, useEffect } from 'react';

const EMOJI_CATEGORIES = [
  { name: 'Smileys', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔'] },
  { name: 'Gestures', emojis: ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏'] },
  { name: 'Hearts', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'] },
  { name: 'Objects', emojis: ['🔥', '⭐', '✨', '💫', '🌟', '💥', '💢', '💯', '💦', '💨', '☀️', '🌙', '⭐', '🌟', '💫', '✨', '🎉', '🎊', '🎈', '🎁'] },
  { name: 'Symbols', emojis: ['✅', '❌', '✔️', '➖', '➕', '❓', '❗', '❗', '💬', '💭', '🗯️', '♠️', '♥️', '♦️', '♣️', '🃏', '🎴', '🀄'] }
];

const EmojiPicker = ({ onEmojiSelect, onClose }) => {
  const [activeCategory, setActiveCategory] = useState(0);
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleEmojiClick = (emoji) => {
    onEmojiSelect(emoji);
  };

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-full right-0 mb-2 w-80 h-96 bg-white border-2 border-gray-200 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden"
    >
      {/* Category Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
        {EMOJI_CATEGORIES.map((category, index) => (
          <button
            key={index}
            onClick={() => setActiveCategory(index)}
            className={`px-3 py-2 text-sm font-semibold whitespace-nowrap transition-all ${
              activeCategory === index
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white'
                : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-100'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Emoji Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-8 gap-2">
          {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji, index) => (
            <button
              key={index}
              onClick={() => handleEmojiClick(emoji)}
              className="text-2xl hover:bg-gray-100 rounded-lg p-2 transition-colors cursor-pointer hover:scale-110 transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmojiPicker;

