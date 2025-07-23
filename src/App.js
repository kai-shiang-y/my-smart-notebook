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
  // ... (既有 state 維持不變)
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
  
  // 新增: 側邊欄區塊折疊狀態
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

  // ... (所有 useEffect 和函式都維持不變)

  // --- 渲染 UI ---
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
              {/* 筆記本區塊 (可折疊) */}
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

              {/* 篩選區塊 (可折疊) */}
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
              
              {/* 今日複習區塊 (可折疊) */}
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
      
              {/* 筆記列表 */}
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
            </>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center p-4 text-center">
              {/* ... 登入提示 ... */}
            </div>
          )}
          
          <div className="p-2 text-center text-xs text-gray-400 border-t mt-auto">
            {/* ... 使用者資訊與登出 ... */}
          </div>
        </aside>
      )}
      {/* ... 其他版面邏輯 ... */}
    </div>
  );
}

function NoteEditor({ note, notebooks, isEditing, setIsEditing, onUpdate, onDelete, storage, user, db, extractTextFromHTML }) {
  // ... (state 維持不變)

  // Quill 編輯器模組設定 (加入 Toggle List)
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
          ['toggle'], // 新增按鈕到工具列
          ['clean']
        ],
        handlers: {
          'image': () => { /* ... 圖片處理 ... */ },
          'toggle': () => {
            const quill = quillRef.current.getEditor();
            const range = quill.getSelection(true);
            // 插入 <details> 和 <summary> 標籤
            quill.clipboard.dangerouslyPasteHTML(range.index, 
              `<details><summary>折疊清單標題</summary><p>在這裡寫下您的內容...</p></details><p><br></p>`, 
              'user'
            );
          }
        }
      }
    }
  }, [storage, user]);

  // ... (所有其他函式維持不變)

  return (
    <div className="flex flex-col h-full">
      {/* ... (所有 UI 元素維持不變) ... */}
    </div>
  );
}

// ... (其他組件維持不變)

