// Cliente de Firebase - punto central de conexión
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
	apiKey: 'AIzaSyAr5kuijB3xoActty2bhcNBZ2BUfFYE0v4',
	authDomain: 'ticketsciplastic.firebaseapp.com',
	projectId: 'ticketsciplastic',
	storageBucket: 'ticketsciplastic.firebasestorage.app',
	messagingSenderId: '752279758850',
	appId: '1:752279758850:web:6f14f35b2be6e75462df1b'
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar Firestore y Storage
export const db = getFirestore(app);
export const storage = getStorage(app);
