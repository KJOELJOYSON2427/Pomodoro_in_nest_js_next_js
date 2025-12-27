'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function Profile() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  // STEP 1: Generate QR
  const generate2FA = async () => {
    setLoading(true);
    const res = await fetch('http://localhost:3001/auth/2fa/generate', {
      method: 'POST',
      credentials: 'include', // IMPORTANT for cookies
    });

    const data = await res.json();
    console.log(data);
    setQrCode(data.qrcode);
    setLoading(false);
  };

  // STEP 2: Verify OTP
  const verifyOTP = async () => {
    setLoading(true);
    const res = await fetch('http://localhost:3001/auth/2fa/verify', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: otp }),
    });

    if (res.ok) {
      setVerified(true);
    }

    setLoading(false);
  };

  // STEP 3: Enable 2FA
  const enable2FA = async () => {
    setLoading(true);
    await fetch('http://localhost:3001/auth/2fa/enable', {
      method: 'POST',
      credentials: 'include',
    });

    setLoading(false);
    alert('2FA Enabled 🎉');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-96 space-y-4">

        <h1 className="text-xl font-semibold text-center">Profile</h1>

        {/* Enable Button */}
        {!qrCode && (
          <button
            onClick={generate2FA}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Enable 2FA
          </button>
        )}

        {/* QR Code */}
        {qrCode && (
          <div className="flex flex-col items-center space-y-4">
            <p className="text-sm text-gray-600">
              Scan this QR code with Google Authenticator
            </p>

            <Image src={qrCode} alt="QR Code" width={180} height={180} />

            {!verified && (
              <>
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="border px-3 py-2 rounded w-full text-center"
                />

                <button
                  onClick={verifyOTP}
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
                >
                  Verify OTP
                </button>
              </>
            )}

            {verified && (
              <button
                onClick={enable2FA}
                className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
              >
                Confirm Enable 2FA
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
