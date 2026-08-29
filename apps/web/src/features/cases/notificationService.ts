import { collection, query, where, getDocs, addDoc, updateDoc, doc, orderBy, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase/client';
import { Notification, NotificationType } from '../../types/models';

export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const notificationsRef = collection(db, 'notifications');
  const q = query(notificationsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const notificationsRef = collection(db, 'notifications');
  const q = query(notificationsRef, where('userId', '==', userId), where('read', '==', false));
  const snapshot = await getDocs(q);
  return snapshot.docs.length;
}

export async function markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
  const docRef = doc(db, 'notifications', notificationId);
  await updateDoc(docRef, {
    read: true,
    updatedAt: new Date().toISOString(),
  });
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const notificationsRef = collection(db, 'notifications');
  const q = query(notificationsRef, where('userId', '==', userId), where('read', '==', false));
  const snapshot = await getDocs(q);
  
  const batch = writeBatch(db);
  const now = new Date().toISOString();
  
  snapshot.docs.forEach(docSnapshot => {
    batch.update(docSnapshot.ref, { read: true, updatedAt: now });
  });
  
  await batch.commit();
}

export async function createNotification(data: Omit<Notification, 'id' | 'createdAt' | 'updatedAt' | 'read'>): Promise<string> {
  const now = new Date().toISOString();
  const notification: Notification = {
    ...data,
    read: false,
    createdAt: now,
    updatedAt: now,
  };
  
  const ref = await addDoc(collection(db, 'notifications'), notification);
  return ref.id;
}
