
"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, sendEmailVerification } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<any>;
  signup: (email: string, pass: string, nickname: string) => Promise<any>;
  logout: () => Promise<any>;
  updateUserProfile: (updates: { displayName?: string; photoURL?: string }) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Sign in error details:', error);
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          throw new Error('Неверный email или пароль.');
        case 'auth/invalid-email':
            throw new Error('Пожалуйста, введите действительный email адрес.');
        case 'auth/configuration-not-found':
          throw new Error('Ошибка конфигурации Firebase. Обратитесь в поддержку.');
        default:
          throw new Error('Не удалось войти. Пожалуйста, попробуйте еще раз.');
      }
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, nickname: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, {
        displayName: nickname
      });
      // Refresh the user state to get the new display name
      setUser({ ...userCredential.user });
    } catch (error: any) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          throw new Error('Этот email уже используется.');
        case 'auth/invalid-email':
          throw new Error('Пожалуйста, введите действительный email адрес.');
        case 'auth/weak-password':
          throw new Error('Пароль должен состоять как минимум из 6 символов.');
        default:
          throw new Error('Не удалось зарегистрироваться. Пожалуйста, попробуйте еще раз.');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      toast({ title: "Ошибка при выходе", variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (updates: { displayName?: string; photoURL?: string }) => {
    if (!auth.currentUser) return;
    try {
        await updateProfile(auth.currentUser, updates);
        setUser({ ...auth.currentUser });
        toast({ title: "Профиль обновлен!" });
    } catch (error: any) {
        toast({ title: "Ошибка обновления", description: error.message, variant: 'destructive' });
        throw error;
    }
  };

  const sendVerificationEmail = async () => {
    if (!auth.currentUser) return;
    try {
        await sendEmailVerification(auth.currentUser);
        toast({ title: "Письмо отправлено", description: "Проверьте свою почту для подтверждения."});
    } catch (error: any) {
        toast({ title: "Ошибка", description: "Не удалось отправить письмо. Попробуйте позже.", variant: 'destructive' });
        throw error;
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUserProfile, sendVerificationEmail }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
