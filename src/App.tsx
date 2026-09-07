/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ActiveTab, TranscriptionRecord, ProjectFileItem } from './types';
import { Header } from './components/Header';
import { HomeDashboard } from './components/HomeDashboard';
import { SpeechToText } from './components/SpeechToText';
import { TextToSpeech } from './components/TextToSpeech';
import { ProjectImporter } from './components/ProjectImporter';
import { HistoryView } from './components/HistoryView';
import { ApkCenter } from './components/ApkCenter';
import { ActivationView } from './components/ActivationView';
import { INITIAL_PROJECT_FILES } from './data/sampleProjectFiles';
import { Smartphone, Sparkles, Shield, Cpu } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('apk-center');
  const [records, setRecords] = useState<TranscriptionRecord[]>(() => {
    try {
      const local = localStorage.getItem('voicetext_records');
      if (local) return JSON.parse(local);
    } catch (e) {}
    return [
      {
        id: 'rec-1',
        type: 'stt',
        title: 'تفريغ تجريبي: مرحباً بكم في تطبيق الصوت والنص',
        content: 'مرحباً بكم في تطبيق تحويل الصوت إلى نص وتفريغ التسجيلات الاحترافي.',
        timestamp: 'اليوم، 10:30 ص',
        language: 'ar-SA',
        wordCount: 11,
      },
      {
        id: 'rec-2',
        type: 'tts',
        title: 'نطق صوتي: تجربة جودة النطق العربي',
        content: 'تم توليد هذا الصوت لاختبار نقاء ومخارج الحروف العربية بالذكاء الاصطناعي.',
        timestamp: 'اليوم، 09:15 ص',
        wordCount: 12,
      },
    ];
  });

  const [projectFiles, setProjectFiles] = useState<ProjectFileItem[]>(INITIAL_PROJECT_FILES);
  const [ttsInputText, setTtsInputText] = useState<string>('');

  // Persist records to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('voicetext_records', JSON.stringify(records));
    } catch (e) {}
  }, [records]);

  const handleSaveRecord = (record: TranscriptionRecord) => {
    setRecords((prev) => [record, ...prev]);
  };

  const handleDeleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const handleClearAllRecords = () => {
    setRecords([]);
  };

  const handleSendToTts = (text: string) => {
    setTtsInputText(text);
    setActiveTab('tts');
  };

  const handleSendToStt = (text: string) => {
    setActiveTab('stt');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Top Navigation Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        savedCount={records.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'apk-center' && (
          <ApkCenter />
        )}

        {activeTab === 'activation' && (
          <ActivationView />
        )}

        {activeTab === 'home' && (
          <HomeDashboard
            onNavigate={(tab) => setActiveTab(tab)}
            savedCount={records.length}
            filesCount={projectFiles.length}
          />
        )}

        {activeTab === 'stt' && (
          <SpeechToText
            onSaveRecord={handleSaveRecord}
            onSendToTts={handleSendToTts}
          />
        )}

        {activeTab === 'tts' && (
          <TextToSpeech
            initialText={ttsInputText}
            onSaveRecord={handleSaveRecord}
            onSendToStt={handleSendToStt}
          />
        )}

        {activeTab === 'importer' && (
          <ProjectImporter
            files={projectFiles}
            setFiles={setProjectFiles}
            onGoToStt={() => setActiveTab('stt')}
            onGoToTts={() => setActiveTab('tts')}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            records={records}
            onDeleteRecord={handleDeleteRecord}
            onClearAll={handleClearAllRecords}
            onSelectRecordForTts={handleSendToTts}
            onSelectRecordForStt={handleSendToStt}
          />
        )}
      </main>

      {/* Bottom Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-bold text-slate-700">VoiceText Studio</span>
            <span>- منصة تحويل الصوت والنص الحديثة</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-blue-500" />
              <span>دعم كامل لمحركات الـ AI والمتصفح</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
              <span>PWA Ready</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
