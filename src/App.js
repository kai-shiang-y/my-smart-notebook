import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// --- UI Components ---
const icons = {
  add: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>,
  save: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" /></svg>,
  edit: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>,
  delete: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>,
  book: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  lightbulb: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
  sparkles: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm6 2a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1zm5 5a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1zM5 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1z" clipRule="evenodd" /></svg>,
  image: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>,
  search: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>,
  tag: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A1 1 0 012 10V5a1 1 0 011-1h5a1 1 0 01.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>,
  quiz: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  graph: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19.5a.5.5 0 01-.5.5h-3a.5.5 0 01-.5-.5v-3a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v3zM11 5.5a.5.5 0 01-.5.5h-3a.5.5 0 01-.5-.5v-3a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v3zM21 11.5a.5.5 0 00-.5-.5h-3a.5.5 0 00-.5.5v3a.5.5 0 00.5.5h3a.5.5 0 00.5-.5v-3zM14 4.5a.5.5 0 00-.5-.5h-3a.5.5 0 00-.5.5v3a.5.5 0 00.5.5h3a.5.5 0 00.5-.5v-3z" /></svg>,
};

export default function App() {
  const [notes, setNotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [db, setDb] = useState(null);
  const [, setAuth] = useState(null);
  const [storage, setStorage] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    try {
      const firebaseConfigString = process.env.REACT_APP_FIREBASE_CONFIG;
      if (!firebaseConfigString) {
        console.error("Firebase config is not defined in environment variables.");
        setIsLoading(false);
        return;
      }
      const firebaseConfig = JSON.parse(firebaseConfigString);

      const app = initializeApp(firebaseConfig);
      const firestore = getFirestore(app);
      const authInstance = getAuth(app);
      const storageInstance = getStorage(app);

      setDb(firestore);
      setAuth(authInstance);
      setStorage(storageInstance);

      const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
        if (user) {
          setUserId(user.uid);
        } else {
          await signInAnonymously(authInstance);
        }
        setIsAuthReady(true);
      });
      return () => unsubscribe();

    } catch (error) {
        console.error("Failed to parse Firebase config or initialize Firebase:", error);
        alert("Firebase 設定檔格式錯誤，請檢查 Netlify 的環境變數。");
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthReady || !db || !userId) return;
    setIsLoading(true);
    const notesCollectionPath = `notes/${userId}/userNotes`; 
    const q = query(collection(db, notesCollectionPath));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), tags: doc.data().tags || [] }));
      notesData.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setNotes(notesData);
      setIsLoading(false);
    }, (error) => {
      console.error("讀取筆記時發生錯誤:", error);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [db, userId, isAuthReady]);

  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const searchMatch = searchTerm 
        ? note.title.toLowerCase().includes(searchTerm.toLowerCase()) || (note.content || '').toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      const tagMatch = selectedTag ? (note.tags || []).includes(selectedTag) : true;
      return searchMatch && tagMatch;
    });
  }, [notes, searchTerm, selectedTag]);

  const allTags = useMemo(() => {
    const tagsSet = new Set();
    notes.forEach(note => {
      (note.tags || []).forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }, [notes]);

  const handleCreateNote = async () => {
    if (!db || !userId) return;
    const notesCollectionPath = `notes/${userId}/userNotes`;
    const newNote = {
      title: "新的問題/主題",
      content: "在這裡寫下您的筆記...",
      tags: [],
      createdAt: serverTimestamp(),
    };
    try {
      const docRef = await addDoc(collection(db, notesCollectionPath), newNote);
      setSelectedNote({ id: docRef.id, ...newNote });
      setIsEditing(true);
    } catch (error) { console.error("新增筆記失敗:", error); }
  };

  const handleSelectNote = (note) => {
    setSelectedNote(note);
    setIsEditing(false);
  };

  const handleUpdateNote = async (id, updatedData) => {
    if (!db || !userId) return;
    const noteDoc = doc(db, `notes/${userId}/userNotes`, id);
    try {
      await updateDoc(noteDoc, updatedData);
      setSelectedNote(prev => ({...prev, ...updatedData}));
      setIsEditing(false);
    } catch (error) { console.error("更新筆記失敗:", error); }
  };

  const handleDeleteNote = async (id) => {
    if (window.confirm("確定要刪除這則筆記嗎？")) {
      if (!db || !userId) return;
      const noteDoc = doc(db, `notes/${userId}/userNotes`, id);
      try {
        await deleteDoc(noteDoc);
        setSelectedNote(null);
      } catch (error) { console.error("刪除筆記失敗:", error); }
    }
  };

  return (
    <div className="flex h-screen font-sans bg-gray-50 text-gray-800">
      <aside className="w-1/4 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-700 flex items-center">{icons.book} <span className="ml-2">學習筆記本</span></h1>
          <button onClick={handleCreateNote} className="p-2 rounded-full text-blue-500 bg-blue-100 hover:bg-blue-200" title="新增筆記">{icons.add}</button>
        </div>

        <div className="p-4 border-b border-gray-200">
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
        </div>

        <div className="overflow-y-auto flex-grow">
          {isLoading ? <p className="p-4 text-gray-500">載入中...</p> : filteredNotes.length > 0 ? (
            filteredNotes.map(note => (
              <div key={note.id} onClick={() => handleSelectNote(note)} className={`p-4 cursor-pointer border-l-4 ${selectedNote?.id === note.id ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:bg-gray-100'}`}>
                <h3 className="font-semibold truncate text-gray-800">{note.title}</h3>
                <p className="text-sm text-gray-500 truncate">{note.content}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(note.tags || []).map(tag => <span key={tag} className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">{tag}</span>)}
                </div>
              </div>
            ))
          ) : <p className="p-4 text-gray-500">找不到符合的筆記。</p>}
        </div>

        <div className="p-2 text-center text-xs text-gray-400 border-t">
          <button className="flex items-center justify-center w-full text-gray-600 hover:text-blue-500" onClick={() => alert('知識圖譜功能即將推出！')}>
            {icons.graph}
            <span className="ml-2">開啟知識圖譜</span>
          </button>
        </div>

      </aside>

      <main className="flex-grow w-1/2 p-6 md:p-8 flex flex-col bg-gray-50 overflow-y-auto">
        {selectedNote ? (
          <NoteEditor key={selectedNote.id} note={selectedNote} isEditing={isEditing} setIsEditing={setIsEditing} onUpdate={handleUpdateNote} onDelete={handleDeleteNote} storage={storage} userId={userId} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            {icons.book}
            <h2 className="mt-4 text-2xl font-semibold">歡迎使用智慧學習筆記本</h2>
            <p className="mt-2">從左側選擇或新增一則筆記開始。</p>
          </div>
        )}
      </main>

      <aside className="w-1/4 bg-white border-l border-gray-200 flex flex-col">
        {/* 智慧關聯區塊 */}
      </aside>
    </div>
  );
}

function NoteEditor({ note, isEditing, setIsEditing, onUpdate, onDelete, storage, userId }) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [tags, setTags] = useState(note.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [quiz, setQuiz] = useState({ questions: [], isLoading: false, error: null });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const callGeminiAPI = async (prompt, jsonSchema = null) => {
    setIsGenerating(true);
    try {
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Gemini API Key is not defined.");
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        ...(jsonSchema && {
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: jsonSchema,
          },
        }),
      };

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
    if (!content) return;
    const prompt = `請根據以下筆記內容，建議 3 到 5 個最相關的關鍵字作為標籤。請只回傳單一詞彙，並用繁體中文。內容：\n\n${content}`;
    const schema = { type: "ARRAY", items: { type: "STRING" } };
    const suggestions = await callGeminiAPI(prompt, schema);
    if (suggestions) {
      setSuggestedTags(suggestions.filter(tag => !tags.includes(tag)));
    }
  };

  const handleGenerateQuiz = async () => {
    setQuiz({ questions: [], isLoading: true, error: null });
    if (!content) {
      setQuiz({ questions: [], isLoading: false, error: "筆記內容是空的！" });
      return;
    }
    const prompt = `請你扮演一位出題老師，根據以下筆記內容，設計 3 題選擇題來幫助我複習。每題都要有 4 個選項，一個正確答案，以及詳解。請用繁體中文回答。筆記內容：\n\n${content}`;
    const schema = {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          "question": { "type": "STRING" },
          "options": { "type": "ARRAY", "items": { "type": "STRING" } },
          "correctAnswer": { "type": "STRING" },
          "explanation": { "type": "STRING" }
        },
        required: ["question", "options", "correctAnswer", "explanation"]
      }
    };
    const questions = await callGeminiAPI(prompt, schema);
    if (questions) {
      setQuiz({ questions: questions.map(q => ({ ...q, showAnswer: false })), isLoading: false, error: null });
    } else {
      setQuiz({ questions: [], isLoading: false, error: "生成測驗失敗。" });
    }
  };

  const addTag = (tag) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };
  const removeTag = (tagToRemove) => setTags(tags.filter(tag => tag !== tagToRemove));

  const handleSetReminder = () => {
    alert(`已為「${title}」設定複習排程！\n（此為功能示意）`);
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !storage || !userId) return;
    setIsUploading(true);
    try {
      const storagePath = `images/${userId}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      const imgTag = `\n<img src="${downloadURL}" alt="${file.name}" style="max-width: 100%; height: auto; border-radius: 8px;"/>\n`;
      setContent(prev => prev + imgTag);
    } catch (error) {
      console.error("圖片上傳失敗:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => onUpdate(note.id, { title, content, tags });

  useEffect(() => {
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags || []);
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
          <button onClick={() => onDelete(note.id)} className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600" disabled={isGenerating || isUploading}>{icons.delete} 刪除</button>
        </div>
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
            <button onClick={() => fileInputRef.current.click()} disabled={isUploading || isGenerating} className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50">{isUploading ? '上傳中...' : <>{icons.image} 插入圖片</>}</button>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            <div className="h-6 border-l border-gray-300"></div>
            <button onClick={handleSuggestTags} disabled={isGenerating} className="flex items-center px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50">{icons.sparkles} 建議標籤</button>
        </div>
      )}

      <div className="flex-grow bg-white rounded-lg shadow-inner overflow-y-auto mb-6">
        {isEditing ? (
          <textarea 
            value={content} 
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full p-4 text-lg leading-relaxed focus:outline-none resize-none"
          />
        ) : (
          <div className="prose prose-lg max-w-none p-4 text-gray-700 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />
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
