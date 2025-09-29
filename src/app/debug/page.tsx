'use client';
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { getApps } from 'firebase/app';

export default function DebugPage() {
  const [status, setStatus] = useState('Checking...');

  useEffect(() => {
    const checkFirebase = async () => {
      try {
        // Проверка инициализации Firebase
        const apps = getApps();
        console.log('Firebase apps:', apps.length);
        
        // Проверка auth конфигурации
        if (auth.app) {
          setStatus('✅ Firebase Auth configured correctly');
          console.log('Auth config OK');
        } else {
          setStatus('❌ Firebase Auth not configured');
        }
      } catch (error: any) {
        console.error('Debug error:', error);
        setStatus(`❌ Error: ${error.message}`);
      }
    };

    checkFirebase();
  }, []);

  return (
    <div style={{ padding: '20px', color: 'white' }}>
      <h1>Firebase Debug</h1>
      <p>Status: {status}</p>
      <p>Check browser console for details</p>
    </div>
  );
}
