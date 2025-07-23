import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query, where, Timestamp, getDocs, writeBatch } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// --- UI Components ---
const icons = {
  add: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>,
  save: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" /></svg>,
  edit: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>,
  delete: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>,
  book: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  lightbulb: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
  sparkles: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm6 2a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1zm5 5a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1zM5 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1z" clipRule="evenodd" /></svg>,
  search: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>,
  quiz: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  graph: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19.5a.5.5 0 01-.5.5h-3a.5.5 0 01-.5-.5v-3a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v3zM11 5.5a.5.5 0 01-.5.5h-3a.5.5 0 01-.5-.5v-3a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v3zM21 11.5a.5.5 0 00-.5-.5h-3a.5.5 0 00-.5.5v3a.5.5 0 00.5.5h3a.5.5 0 00.5-.5v-3zM14 4.5a.5.5 0 00-.5-.5h-3a.5.5 0 00-.5.5v3a.5.5 0 00.5.5h3a.5.5 0 00.5-.5v-3z" /></svg>,
  review: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  check: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  google: <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.018 35.17 44 30.023 44 24c0-1.341-.138-2.65-.389-3.917z"></path></svg>,
  notebookIcon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7l9-4 9 4" /></svg>,
  plusCircle: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  chevronLeft: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>,
  chevronRight: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>,
  chevronDown: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform duration-200" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>,
};

// --- 主應用程式組件 ---
export default function App() {
  const [notes, setNotes] = useState([]);
  const [notebooks, setNotebooks] = useState([]);
  const [selectedNotebookId, setSelectedNotebookId] = useState('all');
  const [reviewNotes, setReviewNotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [storage, setStorage] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const [leftPanelWidth, setLeftPanelWidth] = useState(25);
  const [rightPanelWidth, setRightPanelWidth] = useState(25);
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  
  const [sectionsCollapsed, setSectionsCollapsed] = useState({
    notebooks: false,
    filters: false,
    review: false,
  });

  const toggleSection = (section) => {
    setSectionsCollapsed(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const isResizing = useRef(null);
  const containerRef = useRef(null);

  const handleMouseDown = (panel) => {
    isResizing.current = panel;
  };

  const handleMouseUp = useCallback(() => {
    isResizing.current = null;
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isResizing.current || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const containerWidth = containerRect.width;

    if (isResizing.current === 'left') {
      const newWidth = (mouseX / containerWidth) * 100;
      if (newWidth > 15 && newWidth < 40) {
        setLeftPanelWidth(newWidth);
      }
    } else if (isResizing.current === 'right') {
      const newWidth = ((containerWidth - mouseX) / containerWidth) * 100;
      if (newWidth > 15 && newWidth < 40) {
        setRightPanelWidth(newWidth);
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Firebase 初始化
  useEffect(() => {
    try {
      const firebaseConfigString = process.env.REACT_APP_FIREBASE_CONFIG;
      if (!firebaseConfigString) {
        console.error("Firebase config is not defined.");
        setIsLoading(false); return;
      }
      const firebaseConfig = JSON.parse(firebaseConfigString);
      const app = initializeApp(firebaseConfig);
      const firestore = getFirestore(app);
      const authInstance = getAuth(app);
      const storageInstance = getStorage(app);
      setDb(firestore);
      setAuth(authInstance);
      setStorage(storageInstance);
      const unsubscribe = onAuthStateChanged(authInstance, (currentUser) => {
        setUser(currentUser);
        setIsAuthReady(true);
        setIsLoading(false);
      });
      return () => unsubscribe();
    } catch (error) {
      console.error("Firebase initialization error:", error);
      alert("Firebase 設定錯誤。");
      setIsLoading(false);
    }
  }, []);

  // 讀取筆記本
  useEffect(() => {
    if (!isAuthReady || !db || !user) {
      setNotebooks([]); return;
    }
    const notebooksCollectionPath = `notebooks/${user.uid}/userNotebooks`;
    const q = query(collection(db, notebooksCollectionPath));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notebooksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotebooks(notebooksData);
    });
    return () => unsubscribe();
  }, [db, user, isAuthReady]);

  // 讀取筆記
  useEffect(() => {
    if (!isAuthReady || !db || !user) {
      setNotes([]); return;
    }
    const notesCollectionPath = `notes/${user.uid}/userNotes`;
    const q = selectedNotebookId === 'all'
      ? query(collection(db, notesCollectionPath))
      : query(collection(db, notesCollectionPath), where('notebookId', '==', selectedNotebookId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), tags: doc.data().tags || [] }));
      notesData.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setNotes(notesData);
      setIsLoading(false);
    }, (error) => console.error("Error fetching notes:", error));
    return () => unsubscribe();
  }, [db, user, isAuthReady, selectedNotebookId]);

  // 讀取複習筆記
  useEffect(() => {
    if (!isAuthReady || !db || !user || notes.length === 0) {
      setReviewNotes([]); return;
    }
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));
    const remindersCollectionPath = `reminders/${user.uid}/userReminders`;
    const q = query(
      collection(db, remindersCollectionPath),
      where('reviewDate', '>=', Timestamp.fromDate(todayStart)),
      where('reviewDate', '<=', Timestamp.fromDate(todayEnd)),
      where('completed', '==', false)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reminderNoteIds = new Set(snapshot.docs.map(doc => doc.data().noteId));
      const notesToReview = notes.filter(note => reminderNoteIds.has(note.id));
      setReviewNotes(notesToReview);
    });
    return () => unsubscribe();
  }, [db, user, isAuthReady, notes]);

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google sign-in error:", error);
    }
  };

  const handleSignOut = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      setSelectedNote(null);
      setNotes([]);
      setReviewNotes([]);
    } catch (error) {
      console.error("Sign-out error:", error);
    }
  };
  
  const extractTextFromHTML = (html) => {
    const doc = new DOMParser().parseFromString(html || '', 'text/html');
    return doc.body.textContent || "";
  };
  
  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const searchMatch = searchTerm ? note.title.toLowerCase().includes(searchTerm.toLowerCase()) || extractTextFromHTML(note.content).toLowerCase().includes(searchTerm.toLowerCase()) : true;
      const tagMatch = selectedTag ? (note.tags || []).includes(selectedTag) : true;
      return searchMatch && tagMatch;
    });
  }, [notes, searchTerm, selectedTag]);

  const allTags = useMemo(() => {
    const tagsSet = new Set(notes.flatMap(note => note.tags || []));
    return Array.from(tagsSet).sort();
  }, [notes]);

  const similarNotes = useMemo(() => {
    if (!selectedNote || notes.length <= 1) return [];
    const stopWords = new Set(['的', '是', '在', '我', '你', '他', '她', '它', '了', '嗎', '呢', '啊', '與', '和', '或', '一個', '一些', '這個', '那個', '也', '就', '都', '但', '所以', '因為']);
    const getKeywords = (text) => (text || '').toLowerCase().match(/[\u4e00-\u9fa5a-zA-Z0-9]+/g) || [];
    const selectedTextContent = extractTextFromHTML(selectedNote.content);
    const selectedKeywords = new Set([...getKeywords(selectedNote.title), ...getKeywords(selectedTextContent)].filter(kw => !stopWords.has(kw) && kw.length > 1));
    if (selectedKeywords.size === 0) return [];
    return notes.filter(note => note.id !== selectedNote.id).map(note => {
      const otherTextContent = extractTextFromHTML(note.content);
      const otherKeywords = new Set([...getKeywords(note.title), ...getKeywords(otherTextContent)]);
      const commonKeywords = [...selectedKeywords].filter(kw => otherKeywords.has(kw));
      return { ...note, score: commonKeywords.length, commonKeywords };
    }).filter(note => note.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);
  }, [selectedNote, notes]);

  const handleCreateNote = async () => {
    if (!db || !user) return;
    const notesCollectionPath = `notes/${user.uid}/userNotes`;
    const newNote = {
      title: "新的問題/主題",
      content: "<p>在這裡寫下您的筆記...</p>",
      tags: [],
      notebookId: selectedNotebookId === 'all' ? null : selectedNotebookId,
      createdAt: serverTimestamp(),
    };
    try {
      const docRef = await addDoc(collection(db, notesCollectionPath), newNote);
      setSelectedNote({ id: docRef.id, ...newNote });
      setIsEditing(true);
    } catch (error) { console.error("Error creating note:", error); }
  };
  
  const handleSelectNote = (note) => {
    setSelectedNote(note);
    setIsEditing(false);
  };
  
  const handleUpdateNote = async (id, updatedData) => {
    if (!db || !user) return;
    const noteDoc = doc(db, `notes/${user.uid}/userNotes`, id);
    try {
      await updateDoc(noteDoc, updatedData);
      setSelectedNote(prev => ({...prev, ...updatedData}));
      setIsEditing(false);
    } catch (error) { console.error("Error updating note:", error); }
  };

  const handleDeleteNote = async (id) => {
    if (window.confirm("確定要刪除這則筆記嗎？")) {
      if (!db || !user) return;
      const noteDoc = doc(db, `notes/${user.uid}/userNotes`, id);
      try {
        await deleteDoc(noteDoc);
        setSelectedNote(null);
      } catch (error) { console.error("Error deleting note:", error); }
    }
  };

  const handleMarkReviewAsDone = async (noteId) => {
    if (!db || !user) return;
    const remindersCollectionPath = `reminders/${user.uid}/userReminders`;
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));
    const q = query(
      collection(db, remindersCollectionPath),
      where('noteId', '==', noteId),
      where('reviewDate', '>=', Timestamp.fromDate(todayStart)),
      where('reviewDate', '<=', Timestamp.fromDate(todayEnd)),
      where('completed', '==', false)
    );
    try {
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((docSnapshot) => {
        updateDoc(doc(db, remindersCollectionPath, docSnapshot.id), { completed: true });
      });
    } catch (error) {
      console.error("Error updating review status:", error);
    }
  };

  const handleCreateNotebook = async () => {
    if (!db || !user) return;
    const name = prompt("請輸入新筆記本的名稱：");
    if (name) {
      const notebooksCollectionPath = `notebooks/${user.uid}/userNotebooks`;
      await addDoc(collection(db, notebooksCollectionPath), {
        name: name,
        createdAt: serverTimestamp(),
      });
    }
  };

  const handleSelectNotebook = (notebookId) => {
    setSelectedNotebookId(notebookId);
    setSelectedNote(null);
  };

  const handleDeleteNotebook = async (notebookId, notebookName) => {
    if (window.confirm(`確定要刪除「${notebookName}」筆記本嗎？\n警告：此筆記本中的所有筆記將會被永久刪除！`)) {
        if (!db || !user) return;
        const batch = writeBatch(db);
        const notesCollectionPath = `notes/${user.uid}/userNotes`;
        const q = query(collection(db, notesCollectionPath), where('notebookId', '==', notebookId));
        const notesSnapshot = await getDocs(q);
        notesSnapshot.forEach(doc => batch.delete(doc.ref));
        const notebookDocPath = `notebooks/${user.uid}/userNotebooks/${notebookId}`;
        batch.delete(doc(db, notebookDocPath));
        await batch.commit();
        setSelectedNotebookId('all');
    }
  };
  
  return (
    <div ref={containerRef} className="flex h-screen font-sans bg-gray-50 text-gray-800 overflow-hidden">
      {!isLeftPanelCollapsed && (
        <aside style={{ width: `${leftPanelWidth}%` }} className="flex-shrink-0 bg-white border-r border-gray-200 flex flex-col relative">
          <button onClick={() => setIsLeftPanelCollapsed(true)} className="absolute top-1/2 -right-3 z-10 p-1 bg-gray-200 hover:bg-blue-500 text-gray-600 hover:text-white rounded-full focus:outline-none" title="收疊左側欄">
            {icons.chevronLeft}
          </button>
          
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-700 flex items-center">{icons.book} <span className="ml-2">學習筆記本</span></h1>
            {user && <button onClick={handleCreateNote} className="p-2 rounded-full text-blue-500 bg-blue-100 hover:bg-blue-200" title="新增筆記">{icons.add}</button>}
          </div>
          
          {user ? (
            <div className="overflow-y-auto">
              <div className="p-4 border-b border-gray-200">
                <div onClick={() => toggleSection('notebooks')} className="flex justify-between items-center mb-2 cursor-pointer">
                  <h3 className="text-sm font-semibold text-gray-600">筆記本</h3>
                  <span className={`transform transition-transform ${sectionsCollapsed.notebooks ? '-rotate-90' : ''}`}>{icons.chevronDown}</span>
                </div>
                {!sectionsCollapsed.notebooks && (
                  <>
                    <button onClick={handleCreateNotebook} className="w-full flex items-center justify-center text-blue-500 hover:text-blue-700 mb-2" title="新增筆記本">
                      {icons.plusCircle} <span className="ml-2 text-sm">新增筆記本</span>
                    </button>
                    <ul className="space-y-1">
                      <li onClick={() => handleSelectNotebook('all')} className={`p-2 text-sm rounded-md cursor-pointer flex items-center ${selectedNotebookId === 'all' ? 'bg-blue-100 text-blue-800 font-semibold' : 'hover:bg-gray-100'}`}>
                        {icons.notebookIcon} 所有筆記
                      </li>
                      {notebooks.map(nb => (
                        <li key={nb.id} onClick={() => handleSelectNotebook(nb.id)} className={`p-2 text-sm rounded-md cursor-pointer flex items-center justify-between group ${selectedNotebookId === nb.id ? 'bg-blue-100 text-blue-800 font-semibold' : 'hover:bg-gray-100'}`}>
                          <span className="truncate">{nb.name}</span>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteNotebook(nb.id, nb.name); }} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100" title="刪除筆記本">
                            {icons.delete}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              <div className="p-4 border-b border-gray-200">
                <div onClick={() => toggleSection('filters')} className="flex justify-between items-center mb-2 cursor-pointer">
                  <h3 className="text-sm font-semibold text-gray-600">搜尋與篩選</h3>
                  <span className={`transform transition-transform ${sectionsCollapsed.filters ? '-rotate-90' : ''}`}>{icons.chevronDown}</span>
                </div>
                {!sectionsCollapsed.filters && (
                  <>
                    <div className="relative mb-4">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3">{icons.search}</span>
                      <input type="text" placeholder="搜尋筆記..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">標籤篩選</h3>
                    <div className="flex flex-wrap gap-2">
                      {allTags.map(tag => (
                        <button key={tag} onClick={() => setSelectedTag(tag)} className={`px-2 py-1 text-xs rounded-full ${selectedTag === tag ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>{tag}</button>
                      ))}
                      {selectedTag && <button onClick={() => setSelectedTag(null)} className="px-2 py-1 text-xs rounded-full bg-red-500 text-white">清除篩選</button>}
                    </div>
                  </>
                )}
              </div>
              
              <div className="p-4 border-b border-gray-200">
                <div onClick={() => toggleSection('review')} className="flex justify-between items-center mb-2 cursor-pointer">
                  <h3 className="text-sm font-semibold text-gray-600 flex items-center">{icons.review} 今日複習 ({reviewNotes.length})</h3>
                  <span className={`transform transition-transform ${sectionsCollapsed.review ? '-rotate-90' : ''}`}>{icons.chevronDown}</span>
                </div>
                {!sectionsCollapsed.review && (
                  reviewNotes.length > 0 ? (
                    <ul className="space-y-2 max-h-32 overflow-y-auto">
                      {reviewNotes.map(note => (
                        <li key={note.id} className="flex items-center justify-between text-sm group">
                          <span onClick={() => handleSelectNote(note)} className="truncate cursor-pointer hover:text-blue-600">{note.title}</span>
                          <button onClick={() => handleMarkReviewAsDone(note.id)} className="p-1 rounded-full hover:bg-green-200 opacity-0 group-hover:opacity-100 transition-opacity" title="完成複習">
                            {icons.check}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-400">今天沒有待複習的筆記。</p>
                  )
                )}
              </div>
      
              <div className="overflow-y-auto flex-grow">
                {isLoading ? <p className="p-4 text-gray-500">載入中...</p> : filteredNotes.length > 0 ? (
                  filteredNotes.map(note => (
                    <div key={note.id} onClick={() => handleSelectNote(note)} className={`p-4 cursor-pointer border-l-4 ${selectedNote?.id === note.id ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:bg-gray-100'}`}>
                      <h3 className="font-semibold truncate text-gray-800">{note.title}</h3>
                      <p className="text-sm text-gray-500 truncate">{extractTextFromHTML(note.content)}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(note.tags || []).map(tag => <span key={tag} className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">{tag}</span>)}
                      </div>
                    </div>
                  ))
                ) : <p className="p-4 text-gray-500">找不到符合的筆記。</p>}
              </div>
            </div>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center p-4 text-center">
              <p className="text-gray-600">請登入以開始使用您的雲端筆記本。</p>
              <button onClick={handleGoogleSignIn} className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                {icons.google}
                使用 Google 登入
              </button>
            </div>
          )}
          
          <div className="p-2 text-center text-xs text-gray-400 border-t mt-auto">
            {user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <img src={user.photoURL} alt={user.displayName} className="w-6 h-6 rounded-full" />
                  <span className="ml-2 text-sm text-gray-700 truncate">{user.displayName}</span>
                </div>
                <button onClick={handleSignOut} className="text-red-500 hover:underline text-sm">登出</button>
              </div>
            ) : (
              <p>尚未登入</p>
            )}
          </div>
        </aside>
      )}
      {isLeftPanelCollapsed && (
        <button onClick={() => setIsLeftPanelCollapsed(false)} className="absolute top-1/2 left-0 z-10 p-1 bg-gray-200 hover:bg-blue-500 text-gray-600 hover:text-white rounded-full focus:outline-none" title="展開左側欄">
          {icons.chevronRight}
        </button>
      )}

      {!isLeftPanelCollapsed && !isRightPanelCollapsed && (
        <div onMouseDown={() => handleMouseDown('left')} className="w-1.5 cursor-col-resize bg-gray-200 hover:bg-blue-400 transition-colors duration-200 flex-shrink-0"></div>
      )}

      <main className="flex-grow p-6 md:p-8 flex flex-col bg-gray-50 overflow-y-auto">
        {user && selectedNote ? (
          <NoteEditor key={selectedNote.id} note={selectedNote} notebooks={notebooks} isEditing={isEditing} setIsEditing={setIsEditing} onUpdate={handleUpdateNote} onDelete={handleDeleteNote} storage={storage} user={user} db={db} extractTextFromHTML={extractTextFromHTML}/>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            {icons.book}
            <h2 className="mt-4 text-2xl font-semibold">歡迎使用智慧學習筆記本</h2>
            <p className="mt-2">{user ? '從左側選擇或新增一則筆記開始。' : '請先登入以同步您的筆記。'}</p>
          </div>
        )}
      </main>

      {!isLeftPanelCollapsed && !isRightPanelCollapsed && (
        <div onMouseDown={() => handleMouseDown('right')} className="w-1.5 cursor-col-resize bg-gray-200 hover:bg-blue-400 transition-colors duration-200 flex-shrink-0"></div>
      )}

      {!isRightPanelCollapsed && (
        <aside style={{ width: `${rightPanelWidth}%` }} className="flex-shrink-0 bg-white border-l border-gray-200 flex flex-col relative">
          <button onClick={() => setIsRightPanelCollapsed(true)} className="absolute top-1/2 -left-3 z-10 p-1 bg-gray-200 hover:bg-blue-500 text-gray-600 hover:text-white rounded-full focus:outline-none" title="收疊右側欄">
            {icons.chevronRight}
          </button>
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-700 flex items-center">{icons.lightbulb} <span className="ml-2">智慧關聯</span></h2>
          </div>
          <div className="overflow-y-auto flex-grow p-4">
            {selectedNote ? (
              similarNotes.length > 0 ? (
                <div>
                  <p className="text-sm text-gray-600 mb-4">根據目前筆記，您可能也對這些主題感興趣：</p>
                  <ul className="space-y-3">
                    {similarNotes.map(note => (
                      <li key={note.id} onClick={() => handleSelectNote(note)} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg cursor-pointer hover:bg-yellow-100 hover:shadow-sm transition-all duration-200">
                        <h4 className="font-semibold text-yellow-800">{note.title}</h4>
                        <p className="text-xs text-yellow-600 mt-1">
                          關聯詞: {note.commonKeywords.join(', ')}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-gray-500">找不到相關概念的筆記。試著寫下更多內容，讓關聯更準確！</p>
              )
            ) : (
              <p className="text-gray-500">請先選擇一則筆記，來尋找相關概念。</p>
            )}
          </div>
        </aside>
      )}
       {isRightPanelCollapsed && (
        <button onClick={() => setIsRightPanelCollapsed(false)} className="absolute top-1/2 right-0 z-10 p-1 bg-gray-200 hover:bg-blue-500 text-gray-600 hover:text-white rounded-full focus:outline-none" title="展開右側欄">
          {icons.chevronLeft}
        </button>
      )}
    </div>
  );
}

function NoteEditor({ note, notebooks, isEditing, setIsEditing, onUpdate, onDelete, storage, user, db, extractTextFromHTML }) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [tags, setTags] = useState(note.tags || []);
  const [currentNotebookId, setCurrentNotebookId] = useState(note.notebookId || null);
  const [tagInput, setTagInput] = useState('');
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [quiz, setQuiz] = useState({ questions: [], isLoading: false, error: null });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const quillRef = useRef(null);

  const quillModules = useMemo(() => {
    // 註冊自訂的 Toggle List 格式
    const Parchment = ReactQuill.Quill.import('parchment');
    const Details = new Parchment.BlockBlot();
    Details.tagName = 'DETAILS';
    ReactQuill.Quill.register(Details);

    return {
      toolbar: {
        container: [
          [{ 'header': [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{'color': []}, {'background': []}],
          [{'list': 'ordered'}, {'list': 'bullet'}],
          ['link', 'image', 'table'],
          ['clean']
        ],
        handlers: {
          'image': () => {
            const input = document.createElement('input');
            input.setAttribute('type', 'file');
            input.setAttribute('accept', 'image/*');
            input.click();

            input.onchange = async () => {
              const file = input.files[0];
              if (!file || !storage || !user) return;
              setIsUploading(true);
              try {
                const storagePath = `images/${user.uid}/${Date.now()}_${file.name}`;
                const storageRef = ref(storage, storagePath);
                await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(storageRef);
                
                const quill = quillRef.current.getEditor();
                const range = quill.getSelection(true);
                quill.insertEmbed(range.index, 'image', downloadURL);
                quill.setSelection(range.index + 1);
              } catch (error) {
                console.error("圖片上傳失敗:", error);
              } finally {
                setIsUploading(false);
              }
            };
          }
        }
      }
    }
  }, [storage, user]);

  const callGeminiAPI = async (prompt, jsonSchema = null) => {
    setIsGenerating(true);
    try {
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Gemini API Key is not defined.");
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }], ...(jsonSchema && { generationConfig: { responseMimeType: "application/json", responseSchema: jsonSchema } }) };
      const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error(`API 請求失敗: ${response.status}`);
      const result = await response.json();
      const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!responseText) throw new Error("從 API 收到的回應格式不正確");
      return jsonSchema ? JSON.parse(responseText) : responseText;
    } catch (error) {
      console.error("Gemini API 呼叫錯誤:", error);
      alert(`AI 功能出錯: ${error.message}`);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleSuggestTags = async () => {
    const textContent = extractTextFromHTML(content);
    if (!textContent) return;
    const prompt = `請根據以下筆記內容，建議 3 到 5 個最相關的關鍵字作為標籤。請只回傳單一詞彙，並用繁體中文。內容：\n\n${textContent}`;
    const schema = { type: "ARRAY", items: { type: "STRING" } };
    const suggestions = await callGeminiAPI(prompt, schema);
    if (suggestions) {
      setSuggestedTags(suggestions.filter(tag => !tags.includes(tag)));
    }
  };
  
  const handleGenerateQuiz = async () => {
    setQuiz({ questions: [], isLoading: true, error: null });
    const textContent = extractTextFromHTML(content);
    if (!textContent) {
      setQuiz({ questions: [], isLoading: false, error: "筆記內容是空的！" });
      return;
    }
    const prompt = `請你扮演一位出題老師，根據以下筆記內容，設計 3 題選擇題來幫助我複習。每題都要有 4 個選項，一個正確答案，以及詳解。請用繁體中文回答。筆記內容：\n\n${textContent}`;
    const schema = { type: "ARRAY", items: { type: "OBJECT", properties: { "question": { "type": "STRING" }, "options": { "type": "ARRAY", "items": { "type": "STRING" } }, "correctAnswer": { "type": "STRING" }, "explanation": { "type": "STRING" } }, required: ["question", "options", "correctAnswer", "explanation"] } };
    const questions = await callGeminiAPI(prompt, schema);
    if (questions) {
      setQuiz({ questions: questions.map(q => ({ ...q, showAnswer: false })), isLoading: false, error: null });
    } else {
      setQuiz({ questions: [], isLoading: false, error: "生成測驗失敗。" });
    }
  };

  const handleSetReminder = async () => {
    if (!db || !user) return;
    const today = new Date();
    const reviewIntervals = [1, 3, 7, 14, 30];
    const remindersCollectionPath = `reminders/${user.uid}/userReminders`;
    try {
      for (const days of reviewIntervals) {
        const reviewDate = new Date(today);
        reviewDate.setDate(today.getDate() + days);
        await addDoc(collection(db, remindersCollectionPath), {
          noteId: note.id,
          reviewDate: Timestamp.fromDate(reviewDate),
          completed: false,
          originalNoteTitle: note.title
        });
      }
      alert(`已為「${title}」成功設定 ${reviewIntervals.length} 次的複習排程！`);
    } catch (error) {
      console.error("設定複習排程失敗:", error);
      alert("設定複習排程失敗，請檢查主控台。");
    }
  };

  const addTag = (tag) => {
    if (tag && !tags.includes(tag)) setTags([...tags, tag]);
  };
  const removeTag = (tagToRemove) => setTags(tags.filter(tag => tag !== tagToRemove));
  const handleSave = () => {
    onUpdate(note.id, { title, content, tags, notebookId: currentNotebookId });
  };
  
  useEffect(() => {
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags || []);
      setCurrentNotebookId(note.notebookId || null);
      setQuiz({ questions: [], isLoading: false, error: null });
  }, [note]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-start mb-2 pb-2 border-b">
        {isEditing ? (
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="text-3xl font-bold w-full p-2 -ml-2 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400" />
        ) : (
          <h2 className="text-3xl font-bold text-gray-800">{title}</h2>
        )}
        <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
          {isEditing ? (
            <button onClick={handleSave} className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600" disabled={isGenerating || isUploading}>{icons.save} 儲存</button>
          ) : (
            <button onClick={() => setIsEditing(true)} className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600" disabled={isGenerating || isUploading}>{icons.edit} 編輯</button>
          )}
          <button onClick={() => onDelete(note.id)} className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600" disabled={isGenerating || isUploading}>{icons.delete}</button>
        </div>
      </div>

      <div className="mb-4">
        <label className="text-sm font-medium text-gray-600">所在筆記本：</label>
        <select 
          value={currentNotebookId || ''} 
          onChange={(e) => setCurrentNotebookId(e.target.value || null)}
          className="mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          disabled={!isEditing}
        >
          <option value="">（未分類）</option>
          {notebooks.map(nb => (
            <option key={nb.id} value={nb.id}>{nb.name}</option>
          ))}
        </select>
      </div>
      
      <div className="mb-4">
        {isEditing ? (
          <div className="p-2 bg-gray-100 rounded-lg">
            <div className="flex flex-wrap items-center gap-2">
              {tags.map(tag => (
                <span key={tag} className="flex items-center bg-blue-500 text-white px-3 py-1 rounded-full text-sm">{tag}<button onClick={() => removeTag(tag)} className="ml-2 text-blue-200 hover:text-white">×</button></span>
              ))}
              <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag(tagInput.trim()), setTagInput(''))} placeholder="新增標籤..." className="flex-grow bg-transparent focus:outline-none p-1"/>
            </div>
            {suggestedTags.length > 0 && <div className="mt-2 pt-2 border-t flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600">建議標籤:</span>
              {suggestedTags.map(tag => <button key={tag} onClick={() => { addTag(tag); setSuggestedTags(suggestedTags.filter(t => t !== tag)); }} className="px-2 py-1 text-xs rounded-full bg-green-200 text-green-800 hover:bg-green-300">{tag}</button>)}
            </div>}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">{tags.map(tag => <span key={tag} className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">{tag}</span>)}</div>
        )}
      </div>
      
      {isEditing && (
        <div className="mb-4 flex flex-wrap items-center gap-2 p-2 bg-gray-100 rounded-lg">
            <button onClick={handleSuggestTags} disabled={isGenerating} className="flex items-center px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50">{icons.sparkles} 建議標籤</button>
        </div>
      )}

      <div className="flex-grow bg-white rounded-lg shadow-inner overflow-y-auto mb-6">
        {isEditing ? (
          <ReactQuill 
            ref={quillRef}
            theme="snow"
            value={content} 
            onChange={setContent}
            modules={quillModules}
            className="h-full"
          />
        ) : (
          <div className="prose prose-lg max-w-none p-4 text-gray-700" dangerouslySetInnerHTML={{ __html: content }} />
        )}
      </div>

      {!isEditing && (
        <div className="p-4 bg-gray-100 rounded-lg">
          <h3 className="text-lg font-bold text-gray-800 mb-3">學習工具箱</h3>
          <div className="flex flex-wrap gap-3">
            <button onClick={handleGenerateQuiz} disabled={quiz.isLoading || isGenerating} className="flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50">{icons.quiz} {quiz.isLoading ? '生成測驗中...' : '生成隨堂測驗'}</button>
            <button onClick={handleSetReminder} className="flex items-center px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600">設定複習提醒</button>
          </div>
          <QuizSection quiz={quiz} setQuiz={setQuiz} />
        </div>
      )}
    </div>
  );
}

function QuizSection({ quiz, setQuiz }) {
  if (quiz.isLoading) return <p className="mt-4 text-gray-600">AI 正在努力為您出題中，請稍候...</p>;
  if (quiz.error) return <p className="mt-4 text-red-500">{quiz.error}</p>;
  if (quiz.questions.length === 0) return null;

  const toggleAnswer = (index) => {
    const updatedQuestions = [...quiz.questions];
    updatedQuestions[index].showAnswer = !updatedQuestions[index].showAnswer;
    setQuiz({ ...quiz, questions: updatedQuestions });
  };

  return (
    <div className="mt-6 space-y-6">
      {quiz.questions.map((q, index) => (
        <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg">
          <p className="font-semibold text-gray-800">{index + 1}. {q.question}</p>
          <div className="mt-3 space-y-2">
            {q.options.map((option, i) => (
              <div key={i} className="p-2 border rounded-md">
                <label className="flex items-center">
                  <input type="radio" name={`question-${index}`} className="mr-3"/>
                  <span>{option}</span>
                </label>
              </div>
            ))}
          </div>
          <button onClick={() => toggleAnswer(index)} className="mt-4 text-sm text-blue-600 hover:underline">
            {q.showAnswer ? '隱藏答案' : '顯示答案與詳解'}
          </button>
          {q.showAnswer && (
            <div className="mt-3 p-3 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
              <p className="font-bold text-green-800">正確答案：{q.correctAnswer}</p>
              <p className="mt-1 text-green-700">詳解：{q.explanation}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

