import { useMemo } from 'react';

const PasswordStrength = ({ password }) => {
  const strength = useMemo(() => {
    if (!password) return { level: 0, label: '', color: '#e5e7eb', width: 0 };

    let score = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
      long: password.length >= 12,
    };

    // Calculate score
    if (checks.length) score += 1;
    if (checks.lowercase) score += 1;
    if (checks.uppercase) score += 1;
    if (checks.number) score += 1;
    if (checks.special) score += 1;
    if (checks.long) score += 1;

    // Determine strength level
    if (score <= 2) {
      return {
        level: 1,
        label: 'Weak',
        color: '#ef4444',
        width: 25,
        bgGradient: 'from-red-500 to-red-600',
        icon: '🔴',
      };
    } else if (score <= 4) {
      return {
        level: 2,
        label: 'Fair',
        color: '#f59e0b',
        width: 50,
        bgGradient: 'from-orange-500 to-orange-600',
        icon: '🟠',
      };
    } else if (score <= 5) {
      return {
        level: 3,
        label: 'Good',
        color: '#eab308',
        width: 75,
        bgGradient: 'from-yellow-500 to-yellow-600',
        icon: '🟡',
      };
    } else {
      return {
        level: 4,
        label: 'Strong',
        color: '#10b981',
        width: 100,
        bgGradient: 'from-green-500 to-emerald-600',
        icon: '🟢',
      };
    }
  }, [password]);

  const requirements = [
    { label: 'At least 8 characters', met: password.length >= 8, icon: password.length >= 8 ? '✓' : '○' },
    { label: 'Lowercase letter', met: /[a-z]/.test(password), icon: /[a-z]/.test(password) ? '✓' : '○' },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password), icon: /[A-Z]/.test(password) ? '✓' : '○' },
    { label: 'Number', met: /[0-9]/.test(password), icon: /[0-9]/.test(password) ? '✓' : '○' },
    { label: 'Special character', met: /[^A-Za-z0-9]/.test(password), icon: /[^A-Za-z0-9]/.test(password) ? '✓' : '○' },
  ];

  if (!password) return null;

  return (
    <div className="mt-3 space-y-3 animate-fadeIn">
      {/* Strength Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-gray-700">Password Strength:</span>
          <div className="flex items-center gap-2">
            <span
              className="font-bold transition-all duration-300"
              style={{ color: strength.color }}
            >
              {strength.label}
            </span>
            <span className="text-xl animate-bounce">{strength.icon}</span>
          </div>
        </div>
        
        {/* Animated Progress Bar */}
        <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
          {/* Background Gradient */}
          <div
            className={`absolute inset-0 bg-gradient-to-r ${strength.bgGradient} transition-all duration-500 ease-out`}
            style={{
              width: `${strength.width}%`,
              boxShadow: `0 0 20px ${strength.color}40`,
            }}
          >
          {/* Shimmer Effect */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            style={{
              animation: 'shimmer 2s infinite',
            }}
          />
          </div>
          
          {/* Pulse Effect for Strong Passwords */}
          {strength.level >= 3 && (
            <div
              className="absolute inset-0 bg-white/20 rounded-full"
              style={{
                width: `${strength.width}%`,
                animation: 'pulse-ring 2s infinite',
              }}
            />
          )}
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-600 mb-2">Requirements:</p>
        <div className="grid grid-cols-1 gap-1.5">
          {requirements.map((req, index) => (
            <div
              key={index}
              className={`flex items-center gap-2 text-xs transition-all duration-300 ${
                req.met
                  ? 'text-green-600 font-semibold'
                  : 'text-gray-500'
              }`}
              style={{
                animation: req.met ? `slideInRight 0.3s ease-out ${index * 0.1}s both` : 'none',
              }}
            >
              <span
                className={`text-base transition-all duration-300 ${
                  req.met ? 'scale-125' : 'scale-100'
                }`}
                style={{
                  color: req.met ? '#10b981' : '#9ca3af',
                  textShadow: req.met ? `0 0 8px ${strength.color}60` : 'none',
                }}
              >
                {req.icon}
              </span>
              <span className={req.met ? 'line-through opacity-60' : ''}>
                {req.label}
              </span>
              {req.met && (
                <span className="ml-auto text-green-500 animate-pulse">✓</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Strength Indicators */}
      <div className="flex gap-1 mt-3">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className="flex-1 h-1.5 rounded-full transition-all duration-500"
            style={{
              backgroundColor:
                level <= strength.level ? strength.color : '#e5e7eb',
              boxShadow:
                level <= strength.level
                  ? `0 0 10px ${strength.color}50`
                  : 'none',
              transform: level <= strength.level ? 'scaleY(1.5)' : 'scaleY(1)',
              animation:
                level === strength.level && strength.level > 0
                  ? 'glow 1.5s ease-in-out infinite'
                  : undefined,
            }}
          />
        ))}
      </div>

      {/* Strength Message */}
      {strength.level > 0 && (
        <div
          className="mt-3 p-3 rounded-lg backdrop-blur-sm transition-all duration-500"
          style={{
            backgroundColor: `${strength.color}15`,
            border: `1px solid ${strength.color}30`,
          }}
        >
          <p
            className="text-xs font-medium text-center"
            style={{ color: strength.color }}
          >
            {strength.level === 1 && '⚠️ Your password is too weak. Add more characters and variety.'}
            {strength.level === 2 && '📝 Getting better! Try adding uppercase letters or numbers.'}
            {strength.level === 3 && '✨ Good password! One more requirement for maximum security.'}
            {strength.level === 4 && '🎉 Excellent! Your password is strong and secure.'}
          </p>
        </div>
      )}

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
        @keyframes pulse-ring {
          0%, 100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.1);
          }
        }
        @keyframes glow {
          0%, 100% {
            opacity: 1;
            box-shadow: 0 0 10px ${strength.color}50;
          }
          50% {
            opacity: 0.7;
            box-shadow: 0 0 20px ${strength.color}80;
          }
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default PasswordStrength;

